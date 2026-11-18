import type { MessageKey } from "./en";
import { ruBase } from "./ru.base";
import { ruExtra } from "./extra";

export const ru: Partial<Record<MessageKey, string>> = { ...ruBase, ...ruExtra };
