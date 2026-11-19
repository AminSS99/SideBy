import * as billing from "./billing";
import * as settings from "./settings";
import * as share from "./share";
import * as decisionIntel from "./decisionIntel";
import * as decisionMatrix from "./decisionMatrix";
import * as decisionWatch from "./decisionWatch";
import * as workspaces from "./workspaces";
import * as insight from "./insight";
import * as marketing from "./marketing";
import * as serverAndMobile from "./serverAndMobile";

export const extraScopes = { billing, settings, share, decisionIntel, decisionMatrix, decisionWatch, workspaces, insight, marketing, serverAndMobile } as const;

export const enExtra = { ...billing.en, ...settings.en, ...share.en, ...decisionIntel.en, ...decisionMatrix.en, ...decisionWatch.en, ...workspaces.en, ...insight.en, ...marketing.en, ...serverAndMobile.en } as const;
export const azExtra: Record<string, string> = { ...billing.az, ...settings.az, ...share.az, ...decisionIntel.az, ...decisionMatrix.az, ...decisionWatch.az, ...workspaces.az, ...insight.az, ...marketing.az, ...serverAndMobile.az };
export const ruExtra: Record<string, string> = { ...billing.ru, ...settings.ru, ...share.ru, ...decisionIntel.ru, ...decisionMatrix.ru, ...decisionWatch.ru, ...workspaces.ru, ...insight.ru, ...marketing.ru, ...serverAndMobile.ru };
