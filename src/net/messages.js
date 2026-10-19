import wire from '@jamesdo5/500cardgame-contract/wire.json';

const toConst = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
const constants = (obj) => Object.freeze(Object.fromEntries(Object.keys(obj).map(type => [toConst(type), type])));

export const C2S = constants(wire.c2s);
export const S2C = constants(wire.s2c);
export const PACE = Object.freeze(Object.fromEntries(wire.pace.map(p => [p.toUpperCase(), p])));

const JOIN_ERRORS = ['NAME_TAKEN', 'UNKNOWN_GAME', 'ROOM_FULL', 'BAD_NAME', 'ROOM_CLOSED', 'NOT_JOINED'];
export const JOIN_ERROR_CODES = new Set(wire.errorCodes.filter(code => JOIN_ERRORS.includes(code)));
export const BOT_SKILL = Object.freeze(Object.fromEntries(wire.botSkill.map(s => [s.toUpperCase(), s])));
export const DEFAULT_BOT_SKILL = wire.defaultBotSkill;
export const MOVE_GRADES = Object.freeze(wire.moveGrades.slice());
