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
  "Daily limit reached.": "server.rateLimit.dailyReachedShort",
  "SideBy is at capacity right now. Please try again later.": "server.capacity.atCapacity",
  "Clerk secret key is required.": "server.team.clerkUnavailable",
  "Clerk secret key is required to send invitations.": "server.team.clerkUnavailable",
  "Unable to create billing portal session.": "server.billing.portalFailed",
  "Unable to create checkout.": "server.billing.checkoutFailed",
  "Invalid checkout request.": "server.billing.invalidCheckout",
  "Too many checkout attempts. Please wait a moment.": "server.billing.tooManyAttempts",
  "Upload failed.": "server.upload.failed",
  "Failed to load documents.": "server.upload.loadFailed",
  "Document delete failed.": "server.upload.deleteFailed",
  "Document not found.": "server.upload.notFound",
  "Document id is required.": "server.upload.idRequired",
  "A file upload is required.": "server.upload.fileRequired",
  "Uploaded file is empty.": "server.upload.emptyFile",
  "Unsupported file type. Upload PDF, TXT, or CSV files only.": "server.upload.unsupportedType",
  "Unsupported file MIME type. Upload PDF, TXT, or CSV files only.": "server.upload.unsupportedMime",
  "No text could be extracted from this document.": "server.upload.noTextExtracted",
  "PDF text could not be extracted.": "server.upload.pdfExtractFailed",
  "Document indexing failed. Please try again later.": "server.upload.indexingFailed",
  "Blob storage is not configured. Set BLOB_READ_WRITE_TOKEN.": "server.upload.storageNotConfigured",
  "Knowledge search failed.": "server.upload.searchFailed",
  "Search query is required.": "server.upload.searchQueryRequired",
  "Invalid search.": "server.research.invalidQuery",
  "Unable to search.": "server.research.searchFailed",
  "Enter at least 3 characters.": "server.research.queryTooShort",
  "Keep the search under 300 characters.": "server.research.queryTooLong",
  "All search providers failed.": "server.research.providerUnavailable",
  "Search provider is temporarily unavailable. Please try again shortly.": "server.research.providerUnavailable",
  "Provider unavailable.": "server.research.providerUnavailable",
  "Web search quota exceeded.": "server.research.quotaExceeded",
  "Web search quota reached for today.": "server.research.quotaExceeded",
  "Failed to load projects.": "server.project.loadFailed",
  "Project name is required.": "server.project.nameRequired",
  "You need an active workspace before creating a project.": "server.project.workspaceRequired",
  "Project does not belong to the selected workspace.": "server.project.workspaceMismatch",
  "Not authorized to create projects in this workspace.": "server.project.createUnauthorized",
  "Failed to load workspaces.": "server.workspace.loadFailed",
  "workspaceId is required.": "server.workspace.idRequired",
  "workspaceId query parameter is required.": "server.workspace.idRequired",
  "Workspace name is required.": "server.workspace.nameRequired",
  "Not authorized to access this workspace.": "server.workspace.accessUnauthorized",
  "Not authorized to update this workspace.": "server.workspace.updateUnauthorized",
  "Only organization admins can update workspace settings.": "server.workspace.orgAdminRequired",
  "Not authorized to create workspace for this organization.": "server.workspace.orgCreateUnauthorized",
  "ownerId is required for organization workspaces.": "server.workspace.ownerIdRequired",
  "Unknown workspace resource.": "server.workspace.unknownResource",
  "Internal server error.": "server.http.internalError",
  "Your session has expired. Sign in again to continue.": "server.api.sessionExpired",
  "You don't have access to this in the current workspace.": "server.api.forbidden",
  "That record no longer exists or isn't shared with you.": "server.api.notFound",
  "The request timed out. Check your connection and try again.": "server.api.timeout",
  "You've hit the usage limit. Wait a moment and try again.": "server.api.rateLimitWait",
  "SideBy's service hit a problem. Your work is saved — try again shortly.": "server.api.serverError",
  "You're offline or the connection dropped. Reconnect and try again — nothing was submitted twice.": "server.api.offline",
  "Something went wrong. Please try again.": "server.api.genericError",
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
    pattern: /^You've hit the usage limit\. Try again in about (\d+) seconds?\.$/i,
    resolve: (t, match) => t("server.api.rateLimitSeconds", { seconds: match[1] }),
  },
  {
    pattern: /^File is too large\. Maximum upload size is ([^.]+)\.$/i,
    resolve: (t, match) => t("server.upload.fileTooLarge", { maxSize: match[1] }),
  },
  {
    pattern: /^(?:File size exceeded|maxFileSize exceeded)/i,
    resolve: (t) => t("server.upload.fileTooLarge", { maxSize: "25 MB" }),
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
