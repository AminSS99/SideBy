import type { MessageKey, TFunction } from "./index";

const EXACT_SERVER_MESSAGES: Record<string, MessageKey> = {
  "Team management requires an organization workspace.": "server.team.orgRequired",
  "Workspace not found.": "server.workspace.notFound",
  "Project not found.": "server.project.notFound",
  "Comparison not found.": "server.comparison.notFound",
  "Unable to load comparison.": "server.comparison.loadFailed",
  "Unable to export comparison.": "server.comparison.exportFailed",
  "Another comparison request is still starting. Please try again in a moment.": "server.comparison.alreadyStarting",
  "Another comparison request just created this job. Please try again in a moment.": "server.comparison.justCreated",
  "Comparison lock expired during job setup. Please retry.": "server.comparison.lockExpired",
  "Authentication required.": "server.auth.required",
  "Authentication required": "server.auth.required",
  "Admin access required.": "server.auth.adminRequired",
  "Recent authentication required to delete account. Please sign in again.": "server.auth.recentRequired",
  "Method not allowed": "server.http.methodNotAllowed",
  "Invalid request.": "server.http.invalidRequest",
  "Invalid request body.": "server.http.invalidRequest",
  "Unable to validate request.": "server.validation.unable",
  "Comparison checks are temporarily unavailable. Please try again shortly.": "server.validation.unavailable",
  "Search is temporarily unavailable. Please try again shortly.": "server.search.unavailable",
  "Unable to load usage.": "server.usage.loadFailed",
  "Too many validation requests. Please wait a moment.": "server.rateLimit.validation",
  "Too many requests. Please slow down.": "server.rateLimit.slowDown",
  "Knowledge search rate limit reached. Please wait a moment and try again.": "server.rateLimit.knowledge",
  "Clerk secret key is required.": "server.team.clerkUnavailable",
  "Clerk secret key is required to send invitations.": "server.team.clerkUnavailable",
};

const PATTERN_SERVER_MESSAGES: Array<{
  pattern: RegExp;
  resolve: (t: TFunction, match: RegExpMatchArray) => string;
}> = [
  {
    pattern: /^Too many requests\. Try again in (\d+) seconds?\.$/i,
    resolve: (t, match) => t("server.rateLimit.tryAgainSeconds", { seconds: match[1] }),
  },
  {
    pattern: /^Monthly limit reached \((\d+)\/(\d+)\)\. Resets in (\d+) days?\.$/i,
    resolve: (t, match) =>
      t("server.rateLimit.monthlyReached", { used: match[1], limit: match[2], days: match[3] }),
  },
  {
    pattern: /^Daily limit reached \((\d+)\/(\d+)\)\. Resets in (\d+)h \(([^)]+)\)\.$/i,
    resolve: (t, match) =>
      t("server.rateLimit.dailyReached", {
        used: match[1],
        limit: match[2],
        hours: match[3],
        time: match[4],
      }),
  },
  {
    pattern: /^Clerk invitation failed:/i,
    resolve: (t) => t("server.team.inviteFailed"),
  },
  {
    pattern: /^Clerk role update failed:/i,
    resolve: (t) => t("server.team.roleUpdateFailed"),
  },
  {
    pattern: /^Clerk member removal failed:/i,
    resolve: (t) => t("server.team.memberRemoveFailed"),
  },
];

/**
 * Translate known English server-supplied errors and notices via `t()`,
 * falling back safely to the original message for unrecognized strings.
 */
export function localizeServerMessage(
  t: TFunction,
  rawMessage: string | null | undefined,
): string {
  if (!rawMessage) return "";
  const trimmed = rawMessage.trim();
  if (!trimmed) return "";

  const exactKey = EXACT_SERVER_MESSAGES[trimmed];
  if (exactKey) {
    return t(exactKey);
  }

  for (const entry of PATTERN_SERVER_MESSAGES) {
    const match = trimmed.match(entry.pattern);
    if (match) {
      return entry.resolve(t, match);
    }
  }

  return rawMessage;
}
