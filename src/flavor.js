export const PARTNER_JOKES = [
    "Your partner had that the whole time.",
    "Your partner swoops in!",
    "Your partner carried this time.",
    "Wow, was that your lead? I guess even the best leaders do need help.",
    "Teamwork, mostly your partner's.",
    "Your partner saw that coming three tricks ago.",
];

const FLAVOR_LINES = new Set(PARTNER_JOKES);
export function isFlavorLine(msg) {
    return FLAVOR_LINES.has(msg);
}
