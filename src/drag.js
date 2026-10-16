const G = 12000;
const DAMPING = 3.5;
const OMEGA_MAX = 24;
const ACCEL_MAX = 3 * G;
const LIFT_SCALE = 1.15;
const LIFT_MS = 120;
const SPRING_OMEGA = 26;
const SPRING_ZETA = 0.85;
const SPRING_MAX_MS = 700;
const TRACK_MS = 450;
const THROW_MAX = 900;
const TAP_PX = 6;
const TAP_MS = 300;
const VEL_TAU = 0.04;
const ACC_TAU = 0.05;
const MAX_DT = 0.032;
const STEP = 0.004;
const SHAKE_PX = 9;
const SHAKE_HZ = 11;
const SHAKE_TAU = 0.13;
const SHAKE_MS = 380;
const HYSTERESIS = 40;
const SLOT_DEADBAND = 9;
const TWO_PI = Math.PI * 2;

let cfg = null;
let layer = null;
let stageBox = { left: 0, top: 0, k: 1, w: 0, h: 0 };
let drag = null;
let flights = [];
let raf = 0;
let lastFrame = 0;
let frameHook = null;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const nearestTurn = (theta) => Math.round(theta / TWO_PI) * TWO_PI;

function stageEl() {
    return document.getElementById('stage');
}

function measureStage() {
    const el = stageEl();
    if (!el || !layer) return false;
    const r = el.getBoundingClientRect();
    const w = parseFloat(el.style.width) || r.width;
    const h = parseFloat(el.style.height) || r.height;
    stageBox = { left: r.left, top: r.top, k: w ? r.width / w : 1, w, h };
    layer.style.width = `${w}px`;
    layer.style.height = `${h}px`;
    layer.style.transform = `translate(${r.left}px, ${r.top}px) scale(${stageBox.k})`;
    return true;
}

function toStage(clientX, clientY) {
    return { x: (clientX - stageBox.left) / stageBox.k, y: (clientY - stageBox.top) / stageBox.k };
}

function stageRect(el) {
    const r = el.getBoundingClientRect();
    const k = stageBox.k;
    return { x: (r.left - stageBox.left) / k, y: (r.top - stageBox.top) / k, w: r.width / k, h: r.height / k };
}

function zoneOf(name) {
    return cfg.zones.find(z => z.name === name);
}

function zoneContaining(el) {
    return cfg.zones.find(z => z.el() === el.parentElement);
}

function indexIn(container, el) {
    return Array.prototype.indexOf.call(container.children, el);
}

function insertAt(container, el, index) {
    const others = Array.from(container.children).filter(c => c !== el);
    const ref = index < 0 || index >= others.length ? null : others[index];
    if (el.parentElement === container && el.nextElementSibling === ref) return;
    container.insertBefore(el, ref);
}

function makeClone(el, w, h) {
    const clone = el.cloneNode(true);
    clone.classList.remove('hand-card', 'real-card', 'spun', 'illegal', 'bouncy');
    clone.classList.add('drag-card');
    clone.removeAttribute('id');
    clone.style.width = `${w}px`;
    clone.style.height = `${h}px`;
    return clone;
}

function transformFor(x, y, theta, s, gx, gy) {
    return `translate(${x}px, ${y}px) rotate(${theta}rad) scale(${s}) translate(${-gx}px, ${-gy}px)`;
}

function cacheGeometry(d) {
    d.rects = {};
    for (const z of cfg.zones) {
        const el = z.el();
        if (!el || !el.isConnected) continue;
        const r = stageRect(el);
        if (r.w <= 0 && r.h <= 0) continue;
        const pad = z.pad;
        d.rects[z.name] = {
            x0: r.x - pad.left, y0: r.y - pad.top, x1: r.x + r.w + pad.right, y1: r.y + r.h + pad.bottom,
            ix0: r.x, iy0: r.y, ix1: r.x + r.w, iy1: r.y + r.h,
        };
    }
    const hand = zoneOf('hand').el();
    d.slots = hand ? Array.from(hand.children).map(c => {
        const r = stageRect(c);
        return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    }) : [];
}

function inside(p, x0, y0, x1, y1) {
    return p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1;
}

function hitZone(d, p) {
    for (const z of cfg.zones) {
        const r = d.rects[z.name];
        if (r && z.name !== d.hover && inside(p, r.ix0, r.iy0, r.ix1, r.iy1)) return z.name;
    }
    const h = d.hover && d.rects[d.hover];
    if (h && inside(p, h.x0 - HYSTERESIS, h.y0 - HYSTERESIS, h.x1 + HYSTERESIS, h.y1 + HYSTERESIS)) return d.hover;
    for (const z of cfg.zones) {
        const r = d.rects[z.name];
        if (r && inside(p, r.x0, r.y0, r.x1, r.y1)) return z.name;
    }
    return null;
}

function slotDistance(s, p) {
    const dx = s.x - p.x, dy = (s.y - p.y) * 1.5;
    return Math.hypot(dx, dy);
}

function nearestSlot(d, p, current) {
    let best = 0, bestD = Infinity;
    d.slots.forEach((s, i) => {
        const dist = slotDistance(s, p);
        if (dist < bestD) { bestD = dist; best = i; }
    });
    if (current >= 0 && current < d.slots.length && best !== current && bestD > slotDistance(d.slots[current], p) - SLOT_DEADBAND) return current;
    return best;
}

function clearMarks() {
    cfg.zones.forEach(z => { const el = z.el(); if (el) delete el.dataset.drop; });
}

function markZone(d, zoneName) {
    clearMarks();
    if (zoneName === d.zone) return;
    const el = zoneOf(zoneName).el();
    if (el) el.dataset.drop = cfg.canDrop(d.card, d.zone, zoneName) ? 'refuse' : 'hover';
}

function place(d, name, index) {
    const zone = zoneOf(name);
    const container = zone.el();
    if (!container) return;
    if (d.el.parentElement !== container) {
        insertAt(container, d.el, index);
        zone.enter(d.el);
        d.target = name;
        markZone(d, name);
        cacheGeometry(d);
        return;
    }
    if (index >= 0 && indexIn(container, d.el) !== index) insertAt(container, d.el, index);
}

function updateTarget(d) {
    const z = hitZone(d, d.p);
    d.hover = z;
    if (z === 'hand') {
        const hand = zoneOf('hand').el();
        const current = d.el.parentElement === hand ? indexIn(hand, d.el) : -1;
        place(d, 'hand', nearestSlot(d, d.p, current));
    } else if (z) {
        place(d, z, -1);
    } else {
        place(d, d.zone, d.index);
    }
}

function cancelFlightsFor(el) {
    let cancelled = null;
    flights = flights.filter(f => {
        if (f.el !== el) return true;
        f.clone.remove();
        cancelled = f;
        return false;
    });
    return cancelled;
}

function onPointerDown(evt, zone) {
    if (!cfg || drag || !evt.isPrimary || evt.button !== 0) return;
    const container = zone.el();
    const el = evt.target.closest('[data-card]');
    if (!el || el.parentElement !== container) return;
    evt.preventDefault();
    if (cancelFlightsFor(el)) el.style.opacity = '';
    if (!measureStage()) return;
    const lifted = !!zone.canLift(el);
    const r = stageRect(el);
    const p = toStage(evt.clientX, evt.clientY);
    const spun = el.classList.contains('spun');
    let gx = clamp(p.x - r.x, 0, r.w);
    let gy = clamp(p.y - r.y, 0, r.h);
    if (spun) {
        gx = r.w - gx;
        gy = r.h - gy;
    }
    const rx = r.w / 2 - gx;
    const ry = r.h / 2 - gy;
    const d = {
        pointerId: evt.pointerId,
        el,
        clone: null,
        card: el.dataset.card,
        zone: zone.name,
        index: indexIn(container, el),
        target: zone.name,
        w: r.w, h: r.h, gx, gy, rx, ry,
        I: (r.w * r.w + r.h * r.h) / 12 + rx * rx + ry * ry,
        p, pPrev: p,
        vS: { x: 0, y: 0 }, aS: { x: 0, y: 0 },
        theta: spun ? Math.PI : 0,
        omega: 0,
        scale: 1,
        t0: performance.now(),
        startClient: { x: evt.clientX, y: evt.clientY },
        moved: false,
        lifted,
        spun,
        hover: zone.name,
        slots: [],
        rects: {},
    };
    if (lifted) cacheGeometry(d);
    drag = d;
    try { stageEl().setPointerCapture(evt.pointerId); } catch { }
    if (lifted) {
        el.classList.remove('spun');
        d.clone = makeClone(el, r.w, r.h);
        d.clone.style.transform = transformFor(p.x, p.y, d.theta, 1, gx, gy);
        layer.appendChild(d.clone);
        el.style.opacity = '0';
        document.body.classList.add('dragging-card');
    }
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('blur', onPointerCancel);
    window.addEventListener('resize', onResize);
    startLoop();
}

function onPointerMove(evt) {
    const d = drag;
    if (!d || evt.pointerId !== d.pointerId) return;
    if (!d.moved) {
        const dx = evt.clientX - d.startClient.x, dy = evt.clientY - d.startClient.y;
        if (dx * dx + dy * dy > TAP_PX * TAP_PX) d.moved = true;
    }
    d.p = toStage(evt.clientX, evt.clientY);
    if (d.lifted) updateTarget(d);
}

function onPointerUp(evt) {
    if (!drag || evt.pointerId !== drag.pointerId) return;
    const tap = !drag.moved && performance.now() - drag.t0 < TAP_MS;
    finishDrag(tap, false);
}

function onPointerCancel(evt) {
    if (!drag) return;
    if (evt.type !== 'blur' && evt.pointerId !== drag.pointerId) return;
    finishDrag(false, true);
}

function onResize() {
    if (!measureStage() || !drag || !drag.lifted) return;
    cacheGeometry(drag);
}

function detachDrag() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
    window.removeEventListener('blur', onPointerCancel);
    window.removeEventListener('resize', onResize);
    document.body.classList.remove('dragging-card');
    const d = drag;
    drag = null;
    try { stageEl()?.releasePointerCapture(d.pointerId); } catch { }
    return d;
}

function finishDrag(tap, cancelled) {
    const d = detachDrag();
    if (!d.lifted) {
        if (tap) cfg.onTap(d.el, d.zone);
        return;
    }
    clearMarks();
    if (!d.el.isConnected) {
        d.clone.remove();
        stopIfIdle();
        return;
    }
    let to = d.target;
    let spin = false;
    let shake = false;
    if (cancelled) {
        to = d.zone;
        place(d, d.zone, d.index);
    } else if (tap) {
        const want = cfg.onTap(d.el, d.zone);
        spin = want === 'spin';
        to = want && !spin && want !== d.zone && zoneOf(want)?.el() ? want : d.zone;
        place(d, to, to === d.zone ? d.index : -1);
    }
    if (!zoneOf(to)?.el() || !d.el.isConnected) {
        d.clone.remove();
        if (d.el.isConnected) d.el.style.opacity = '';
        stopIfIdle();
        return;
    }
    if (to !== d.zone) {
        const msg = cfg.canDrop(d.card, d.zone, to);
        if (msg) {
            cfg.notify(msg);
            shake = true;
            to = d.zone;
            place(d, d.zone, d.index);
        } else {
            cfg.onMove(d.card, d.zone, to, d.index);
        }
    } else if (to === 'hand' && indexIn(zoneOf('hand').el(), d.el) !== d.index) {
        cfg.onMove(d.card, d.zone, to, d.index);
    }
    const upsideDown = spin !== d.spun && to === 'hand';
    const thetaTarget = upsideDown ? Math.round((d.theta - Math.PI) / TWO_PI) * TWO_PI + Math.PI : nearestTurn(d.theta);
    const speed = Math.hypot(d.vS.x, d.vS.y);
    const throttle = speed > THROW_MAX ? THROW_MAX / speed : 1;
    const settle = upsideDown ? () => {
        d.el.style.transition = 'none';
        d.el.classList.add('spun');
        void d.el.offsetWidth;
        d.el.style.transition = '';
    } : null;
    flights.push(newFlight({
        clone: d.clone, el: d.el, w: d.w, h: d.h, gx: d.gx, gy: d.gy,
        x: d.p.x, y: d.p.y, vx: d.vS.x * 0.5 * throttle, vy: d.vS.y * 0.5 * throttle,
        theta: d.theta, omega: d.omega, s: d.scale, vs: 0,
    }, stageRect(d.el), thetaTarget, shake, settle));
    startLoop();
}

function aimFlight(f, targetRect) {
    const ts = f.w ? targetRect.w / f.w : 1;
    const cx = f.w / 2 - f.gx, cy = f.h / 2 - f.gy;
    const cos = Math.cos(f.tTheta), sin = Math.sin(f.tTheta);
    const sx = targetRect.x + targetRect.w / 2, sy = targetRect.y + targetRect.h / 2;
    f.tx = sx - ts * (cos * cx - sin * cy);
    f.ty = sy - ts * (sin * cx + cos * cy);
    f.ts = ts;
}

function newFlight(state, targetRect, thetaTarget, shake, onSettle) {
    const f = { ...state, tTheta: thetaTarget, shake, onSettle, t0: performance.now() };
    aimFlight(f, targetRect);
    return f;
}

function springStep(f, h) {
    const k = SPRING_OMEGA * SPRING_OMEGA, c = 2 * SPRING_ZETA * SPRING_OMEGA;
    f.vx += (-k * (f.x - f.tx) - c * f.vx) * h;
    f.vy += (-k * (f.y - f.ty) - c * f.vy) * h;
    f.omega += (-k * (f.theta - f.tTheta) - c * f.omega) * h;
    f.vs += (-k * (f.s - f.ts) - c * f.vs) * h;
    f.x += f.vx * h;
    f.y += f.vy * h;
    f.theta += f.omega * h;
    f.s += f.vs * h;
}

function flightSettled(f, elapsed) {
    if (elapsed > SPRING_MAX_MS) return true;
    if (f.shake && elapsed < SHAKE_MS) return false;
    return Math.abs(f.x - f.tx) < 0.5 && Math.abs(f.y - f.ty) < 0.5 && Math.abs(f.vx) < 15 && Math.abs(f.vy) < 15
        && Math.abs(f.theta - f.tTheta) < 0.01 && Math.abs(f.omega) < 0.3 && Math.abs(f.s - f.ts) < 0.004;
}

function finishFlight(f) {
    f.clone.remove();
    if (f.el.isConnected) {
        f.el.style.opacity = '';
        f.onSettle?.();
    }
}

function stepDrag(d, dt, realDt, now) {
    const p = d.p;
    const vRawX = (p.x - d.pPrev.x) / realDt, vRawY = (p.y - d.pPrev.y) / realDt;
    d.pPrev = p;
    const aV = 1 - Math.exp(-realDt / VEL_TAU);
    const prevVx = d.vS.x, prevVy = d.vS.y;
    d.vS.x += (vRawX - d.vS.x) * aV;
    d.vS.y += (vRawY - d.vS.y) * aV;
    const aA = 1 - Math.exp(-realDt / ACC_TAU);
    d.aS.x += ((d.vS.x - prevVx) / realDt - d.aS.x) * aA;
    d.aS.y += ((d.vS.y - prevVy) / realDt - d.aS.y) * aA;
    const mag = Math.hypot(d.aS.x, d.aS.y);
    const lim = mag > ACCEL_MAX ? ACCEL_MAX / mag : 1;
    const gx = -d.aS.x * lim;
    const gy = G - d.aS.y * lim;
    const n = Math.max(1, Math.ceil(dt / STEP));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
        const cos = Math.cos(d.theta), sin = Math.sin(d.theta);
        const rwx = cos * d.rx - sin * d.ry;
        const rwy = sin * d.rx + cos * d.ry;
        const alpha = (rwx * gy - rwy * gx) / d.I - DAMPING * d.omega;
        d.omega = clamp(d.omega + alpha * h, -OMEGA_MAX, OMEGA_MAX);
        d.theta += d.omega * h;
    }
    d.scale = 1 + (LIFT_SCALE - 1) * easeOut(clamp((now - d.t0) / LIFT_MS, 0, 1));
    d.clone.style.transform = transformFor(p.x, p.y, d.theta, d.scale, d.gx, d.gy);
}

function frame(now) {
    raf = 0;
    const realDt = Math.max(0.001, (now - lastFrame) / 1000);
    const dt = Math.min(realDt, MAX_DT);
    lastFrame = now;
    if (drag?.lifted) {
        if (!drag.el.isConnected) {
            detachDrag().clone.remove();
            clearMarks();
        } else {
            stepDrag(drag, dt, realDt, now);
        }
    }
    if (flights.length) {
        const n = Math.max(1, Math.ceil(dt / STEP));
        const h = dt / n;
        const keep = [];
        for (const f of flights) {
            if (!f.el.isConnected) { f.clone.remove(); continue; }
            const elapsed = now - f.t0;
            if (elapsed < TRACK_MS) aimFlight(f, stageRect(f.el));
            for (let i = 0; i < n; i++) springStep(f, h);
            if (flightSettled(f, elapsed)) { finishFlight(f); continue; }
            const t = elapsed / 1000;
            const shake = f.shake ? SHAKE_PX * Math.sin(TWO_PI * SHAKE_HZ * t) * Math.exp(-t / SHAKE_TAU) : 0;
            f.clone.style.transform = transformFor(f.x + shake, f.y, f.theta, f.s, f.gx, f.gy);
            keep.push(f);
        }
        flights = keep;
    }
    frameHook?.(now, dt, drag);
    if (drag || flights.length) raf = requestAnimationFrame(frame);
}

function startLoop() {
    if (raf) return;
    lastFrame = performance.now();
    raf = requestAnimationFrame(frame);
}

function stopIfIdle() {
    if (!drag && !flights.length && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
    }
}

function restore(d) {
    d.clone?.remove();
    if (!d.el.isConnected) return;
    const origin = zoneOf(d.zone)?.el();
    if (origin) {
        const moved = d.el.parentElement !== origin;
        insertAt(origin, d.el, d.index);
        if (moved) zoneOf(d.zone).enter(d.el);
    }
    d.el.style.opacity = '';
}

export const cardDrag = {
    init(config) {
        cfg = config;
        if (!layer) {
            layer = document.createElement('div');
            layer.className = 'drag-layer';
            document.body.appendChild(layer);
        }
        for (const z of cfg.zones) {
            z.pad = { top: 0, right: 0, bottom: 0, left: 0, ...(z.pad ?? {}) };
            z.handler = (evt) => onPointerDown(evt, z);
            z.el()?.addEventListener('pointerdown', z.handler);
        }
    },
    dispose() {
        this.abort();
        cfg?.zones.forEach(z => z.el()?.removeEventListener('pointerdown', z.handler));
        layer?.remove();
        layer = null;
        cfg = null;
        frameHook = null;
    },
    abort() {
        if (drag) {
            const d = detachDrag();
            if (d.lifted) {
                clearMarks();
                restore(d);
            }
        }
        flights.forEach(f => { f.clone.remove(); if (f.el.isConnected) f.el.style.opacity = ''; });
        flights = [];
        stopIfIdle();
    },
    active() {
        return drag?.lifted ? { card: drag.card, from: drag.zone } : null;
    },
    flyTo(el, to, index = -1) {
        if (!cfg || !layer || !el?.isConnected || !measureStage()) return false;
        const fromZone = zoneContaining(el);
        const zone = zoneOf(to);
        const container = zone?.el();
        if (!fromZone || !container) return false;
        if (drag?.el === el) this.abort();
        const prior = cancelFlightsFor(el);
        const r = stageRect(el);
        const spun = el.classList.contains('spun');
        const clone = prior ? prior.clone : makeClone(el, r.w, r.h);
        el.classList.remove('spun');
        insertAt(container, el, index);
        zone.enter(el);
        el.style.opacity = '0';
        cfg.onMove(el.dataset.card, fromZone.name, to, -1);
        const target = stageRect(el);
        const start = prior
            ? { clone, el, w: prior.w, h: prior.h, gx: prior.gx, gy: prior.gy, x: prior.x, y: prior.y, vx: prior.vx, vy: prior.vy, theta: prior.theta, omega: prior.omega, s: prior.s, vs: prior.vs }
            : { clone, el, w: r.w, h: r.h, gx: r.w / 2, gy: r.h / 2, x: r.x + r.w / 2, y: r.y + r.h / 2, vx: 0, vy: 0, theta: spun ? Math.PI : 0, omega: 0, s: 1, vs: 3.5 };
        if (!prior) clone.style.transform = transformFor(start.x, start.y, start.theta, 1, start.gx, start.gy);
        layer.appendChild(clone);
        flights.push(newFlight(start, target, nearestTurn(start.theta), false, null));
        startLoop();
        return true;
    },
    onFrame(fn) {
        frameHook = fn;
    },
};
