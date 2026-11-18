import type { MessageKey } from "./en";
import { azBase } from "./az.base";
import { azExtra } from "./extra";

export const az: Partial<Record<MessageKey, string>> = { ...azBase, ...azExtra };
