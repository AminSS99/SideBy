/**
 * Strings for scope "billing". Keep every key inside this scope's prefix (see the brief).
 * `az` and `ru` must define exactly the keys of `en` (enforced by the type below).
 */
export const en = {} as const;

type Keys = keyof typeof en;
export const az: Record<Keys, string> = {};
export const ru: Record<Keys, string> = {};
