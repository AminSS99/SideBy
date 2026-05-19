const SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bsk_live_[A-Za-z0-9_-]{20,}\b/,
  /\bghp_[A-Za-z0-9_]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\b(?:api[_-]?key|secret|token)\s*[:=]\s*['"]?[A-Za-z0-9_./+=-]{24,}/i,
];

export function assertNoLikelySecrets(input: string) {
  if (SECRET_PATTERNS.some((pattern) => pattern.test(input))) {
    throw Object.assign(
      new Error("This input looks like it may contain an API key or secret. Remove secrets before sending it to SideBy."),
      { statusCode: 422, code: "SECRET_DETECTED" },
    );
  }
}
