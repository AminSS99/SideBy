import { enBase } from "./en.base";
import { enExtra } from "./extra";

/** English is the source of truth: base keys plus per-scope files in ./extra. */
export const en = { ...enBase, ...enExtra } as const;
export type MessageKey = keyof typeof en;
