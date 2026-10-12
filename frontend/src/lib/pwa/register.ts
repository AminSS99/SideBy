/**
 * Service worker registration + update lifecycle for SideBy.
 *
 * Registration uses vite-plugin-pwa's virtual module through a normal
 * static import so Vite resolves it at build time. (A variable dynamic
 * import with `// @vite-ignore` survives into the bundle as an unresolvable
 * `import("virtual:pwa-register")` and silently breaks registration.)
 *
 * Draft preservation policy:
 * - Authenticated drafts are scoped to (account, workspace). A draft saved
 *   by account A is never restored for account B, nor across workspaces.
 * - Anonymous drafts live in an explicit anonymous partition and are never
 *   migrated into an authenticated session (prevents cross-account leaks on
 *   shared devices). They expire with the tab like all sessionStorage data.
 * - Legacy unscoped records (bare form data without an envelope) cannot
 *   prove ownership, so they are discarded on read rather than restored.
 * - Identity that is still loading restores nothing: callers must pass a
 *   resolved scope, and a null scope always yields null.
 * - Payload fields are strictly type-validated: drafts with corrupted or
 *   unexpected property types are purged rather than passed to composers.
 */

import { registerSW } from "virtual:pwa-register";
import { reloadPage, waitForNewController } from "@/lib/safe-storage";

type PwaListener = () => void;

/** Identity a draft belongs to. Null userId + anonymous=false is never valid. */
export interface DraftScope {
  userId: string | null;
  workspaceId: string | null;
  anonymous: boolean;
}

export type DraftSaver = () => { key: string; data: unknown; scope: DraftScope } | null;

export type DraftPayloadValidator<T = unknown> = (data: unknown) => data is T;

export interface DraftSaveResult {
  saved: number;
  failed: Array<{ key: string; reason: string }>;
  ok: boolean;
}

export const DRAFT_STORAGE_KEY = "sideby_preserved_drafts_v1";
export const DRAFT_SCHEMA_VERSION = 1;
/** Drafts older than this are treated as expired and pruned on access. */
export const DRAFT_RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_DRAFT_BYTES = 16 * 1024;
const MAX_DRAFT_ENTRIES = 20;

interface DraftEnvelope {
  version: number;
  createdAt: number;
  kind: string;
  scope: DraftScope;
  data: unknown;
}

/** Guarded access: even reading `window.sessionStorage` can throw when blocked. */
function getSessionStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function reportRegistrationError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.warn("Service worker registration failed; continuing without offline support:", message);
  // Observable through the existing error-tracking path without PII.
  import("@sentry/react")
    .then((Sentry) => {
      Sentry.captureException(error instanceof Error ? error : new Error(message), {
        tags: { area: "pwa-registration" },
      });
    })
    .catch(() => {
      // Sentry unavailable — console warning above is the fallback.
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidOptionalString(val: unknown): boolean {
  return val === undefined || typeof val === "string";
}

/**
 * Validates payload fields for known draft kinds to guarantee invalid
 * field types (e.g. numbers, objects, arrays) cannot reach React composers.
 */
export function isValidDraftPayload(kind: string, data: unknown): boolean {
  if (!isRecord(data)) return false;

  if (kind === "composer") {
    const { entityA, entityB, context, ...rest } = data;
    if (Object.keys(rest).length > 0) return false;
    return isValidOptionalString(entityA) && isValidOptionalString(entityB) && isValidOptionalString(context);
  }

  if (kind === "bracket_composer") {
    const { rawOptions, context, ...rest } = data;
    if (Object.keys(rest).length > 0) return false;
    return isValidOptionalString(rawOptions) && isValidOptionalString(context);
  }

  // Safe fallback for other draft kinds: all top-level values must be primitive or null
  for (const val of Object.values(data)) {
    if (val !== null && typeof val !== "string" && typeof val !== "number" && typeof val !== "boolean") {
      return false;
    }
  }
  return true;
}

function isValidScope(scope: unknown): scope is DraftScope {
  if (!isRecord(scope)) return false;
  const { userId, workspaceId, anonymous } = scope as Record<string, unknown>;
  if (typeof anonymous !== "boolean") return false;
  if (anonymous) return userId === null || typeof userId === "string";
  return typeof userId === "string" && userId.length > 0 && (workspaceId === null || typeof workspaceId === "string");
}

function isValidEnvelope(value: unknown): value is DraftEnvelope {
  if (!isRecord(value)) return false;
  if (value.version !== DRAFT_SCHEMA_VERSION) return false;
  if (typeof value.createdAt !== "number" || !Number.isFinite(value.createdAt)) return false;
  if (typeof value.kind !== "string" || value.kind.length === 0) return false;
  if (!isValidScope(value.scope)) return false;
  if (!isValidDraftPayload(value.kind, value.data)) return false;
  if (Date.now() - value.createdAt > DRAFT_RETENTION_MS) return false;
  return true;
}

function scopesMatch(stored: DraftScope, current: DraftScope): boolean {
  if (stored.anonymous !== current.anonymous) return false;
  if (stored.anonymous) return true;
  return stored.userId === current.userId && (stored.workspaceId ?? null) === (current.workspaceId ?? null);
}

function readEnvelopes(storage: Storage): Record<string, DraftEnvelope> {
  let raw: string | null = null;
  try {
    raw = storage.getItem(DRAFT_STORAGE_KEY);
  } catch {
    return {};
  }
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!isRecord(parsed)) return {};
  const valid: Record<string, DraftEnvelope> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (isValidEnvelope(value) && value.kind === key) valid[key] = value;
  }
  return valid;
}

export class PwaUpdateStore {
  private needRefreshListeners = new Set<PwaListener>();
  private offlineReadyListeners = new Set<PwaListener>();

  needRefresh = false;
  offlineReady = false;

  updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;
  private dirtyCheckers = new Set<() => boolean>();
  private draftSavers = new Set<DraftSaver>();

  onNeedRefresh(listener: PwaListener): () => void {
    this.needRefreshListeners.add(listener);
    return () => this.needRefreshListeners.delete(listener);
  }

  onOfflineReady(listener: PwaListener): () => void {
    this.offlineReadyListeners.add(listener);
    return () => this.offlineReadyListeners.delete(listener);
  }

  notifyNeedRefresh(): void {
    this.needRefresh = true;
    this.needRefreshListeners.forEach((listener) => listener());
  }

  notifyOfflineReady(): void {
    this.offlineReady = true;
    this.offlineReadyListeners.forEach((listener) => listener());
  }

  registerDirtyChecker(checker: () => boolean): () => void {
    this.dirtyCheckers.add(checker);
    return () => this.dirtyCheckers.delete(checker);
  }

  registerDraftSaver(saver: DraftSaver): () => void {
    this.draftSavers.add(saver);
    return () => this.draftSavers.delete(saver);
  }

  isDirty(): boolean {
    for (const checker of this.dirtyCheckers) {
      try {
        if (checker()) return true;
      } catch {
        // A throwing checker must not break update flow; treat as clean.
      }
    }
    return false;
  }

  /**
   * Snapshots all active savers into sessionStorage (read-modify-write so
   * unrelated valid records survive) and reports per-draft failures instead
   * of swallowing them. Callers must keep dirty input when `ok` is false.
   */
  saveAllDrafts(): DraftSaveResult {
    const storage = getSessionStorage();
    if (!storage) {
      return { saved: 0, failed: [{ key: "*", reason: "storage-unavailable" }], ok: false };
    }
    const existing = readEnvelopes(storage);
    const failed: Array<{ key: string; reason: string }> = [];
    let saved = 0;

    for (const saver of this.draftSavers) {
      let item: { key: string; data: unknown; scope: DraftScope } | null = null;
      try {
        item = saver();
      } catch {
        continue;
      }
      if (!item || !item.key || item.data === undefined) continue;
      if (!isRecord(item.data)) {
        failed.push({ key: item.key, reason: "invalid-data" });
        continue;
      }
      if (!isValidScope(item.scope)) {
        failed.push({ key: item.key, reason: "invalid-scope" });
        continue;
      }
      if (!isValidDraftPayload(item.key, item.data)) {
        failed.push({ key: item.key, reason: "invalid-payload-fields" });
        continue;
      }
      let serialized: string;
      try {
        serialized = JSON.stringify(item.data);
      } catch {
        failed.push({ key: item.key, reason: "unserializable" });
        continue;
      }
      if (serialized.length > MAX_DRAFT_BYTES) {
        failed.push({ key: item.key, reason: "too-large" });
        continue;
      }
      existing[item.key] = {
        version: DRAFT_SCHEMA_VERSION,
        createdAt: Date.now(),
        kind: item.key,
        scope: { ...item.scope },
        data: item.data,
      };
      saved += 1;
    }

    const keys = Object.keys(existing);
    if (keys.length === 0) {
      try {
        storage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        return { saved, failed: [{ key: "*", reason: "storage-unavailable" }], ok: false };
      }
      return { saved, failed, ok: failed.length === 0 };
    }
    if (keys.length > MAX_DRAFT_ENTRIES) {
      return { saved: 0, failed: [{ key: "*", reason: "store-full" }], ok: false };
    }
    try {
      storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(existing));
    } catch {
      return {
        saved: 0,
        failed: keys.map((key) => ({ key, reason: "quota-exceeded" })),
        ok: false,
      };
    }
    return { saved, failed, ok: failed.length === 0 };
  }

  /**
   * Returns the stored draft only when the record is a valid envelope whose
   * scope matches the caller's resolved identity and whose payload passes
   * strict field validation. A null scope (identity still loading) never restores.
   * Malformed or legacy unscoped records are safely purged on read.
   */
  getPreservedDraft<T>(
    key: string,
    scope: DraftScope | null,
    validator?: DraftPayloadValidator<T>,
  ): T | null {
    const storage = getSessionStorage();
    if (!storage || !scope || !isValidScope(scope)) return null;
    let raw: string | null = null;
    try {
      raw = storage.getItem(DRAFT_STORAGE_KEY);
    } catch {
      return null;
    }
    if (!raw) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    if (!isRecord(parsed)) return null;
    const record = parsed[key];
    if (record === undefined) return null;
    if (!isValidEnvelope(record) || record.kind !== key) {
      // Legacy or malformed record: discard it rather than guessing ownership.
      this.clearPreservedDraft(key);
      return null;
    }
    if (!scopesMatch(record.scope, scope)) return null;
    if (validator && !validator(record.data)) {
      this.clearPreservedDraft(key);
      return null;
    }
    return record.data as T;
  }

  /** Removes one consumed record, preserving unrelated valid records. */
  clearPreservedDraft(key: string): void {
    const storage = getSessionStorage();
    if (!storage) return;
    try {
      const raw = storage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed)) {
        storage.removeItem(DRAFT_STORAGE_KEY);
        return;
      }
      delete parsed[key];
      if (Object.keys(parsed).length === 0) {
        storage.removeItem(DRAFT_STORAGE_KEY);
      } else {
        storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {
      // Ignore storage errors on cleanup.
    }
  }

  /**
   * Sign-out / account-switch policy: authenticated drafts become
   * inaccessible (removed); anonymous drafts are left untouched in their own
   * partition and expire with the tab.
   */
  clearAuthenticatedDrafts(): void {
    const storage = getSessionStorage();
    if (!storage) return;
    try {
      const raw = storage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed)) {
        storage.removeItem(DRAFT_STORAGE_KEY);
        return;
      }
      const remaining: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (isValidEnvelope(value) && value.kind === key && value.scope.anonymous) {
          remaining[key] = value;
        }
      }
      if (Object.keys(remaining).length === 0) {
        storage.removeItem(DRAFT_STORAGE_KEY);
      } else {
        storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(remaining));
      }
    } catch {
      // Ignore storage errors on cleanup.
    }
  }

  /**
   * Activates the waiting worker and reloads into it. The reload is explicit
   * and owned here rather than delegated to the registration plugin: the
   * plugin reloads on its "controlling" event only when its isUpdate flag —
   * captured once at register() time — is true, which silently skips the
   * reload for pages that loaded while uncontrolled. Waiting for the
   * controller handoff first keeps the update deterministic; on timeout the
   * reload still proceeds so the UI is never stuck on a spinner.
   */
  private async activateAndReload(): Promise<boolean> {
    try {
      await this.updateServiceWorker!(true);
    } catch (error) {
      console.error("Failed to apply service worker update:", error);
      return false;
    }
    try {
      await waitForNewController(30_000);
    } catch (error) {
      console.warn("Update handoff timed out; reloading anyway.", error);
    }
    reloadPage();
    return true;
  }

  /**
   * Applies a waiting update. Returns false (without reloading) when dirty
   * input could not be preserved, so the caller can offer retry or an
   * explicit discard instead of silently losing work.
   */
  async applyUpdate(): Promise<boolean> {
    const saveResult = this.saveAllDrafts();
    if (!saveResult.ok && this.isDirty()) {
      console.warn("Update deferred: draft preservation failed.", saveResult.failed);
      return false;
    }

    if (!this.updateServiceWorker) {
      reloadPage();
      return true;
    }
    return this.activateAndReload();
  }

  /**
   * Explicit user-chosen refresh that skips draft preservation. Only used
   * after a failed save when the user decides to discard drafts and update
   * anyway — never called automatically.
   */
  async forceApplyUpdate(): Promise<boolean> {
    if (!this.updateServiceWorker) {
      reloadPage();
      return true;
    }
    return this.activateAndReload();
  }

  dismissUpdate(): void {
    this.needRefresh = false;
    this.needRefreshListeners.forEach((listener) => listener());
  }
}

export const pwaUpdates = new PwaUpdateStore();

if (typeof window !== "undefined") {
  (window as unknown as { __pwaUpdates?: PwaUpdateStore }).__pwaUpdates = pwaUpdates;
}

/**
 * Registers the generated service worker. Safe to call in any environment:
 * non-production builds and unsupported browsers resolve immediately.
 * Registration failures are reported (Sentry + console) and never break
 * the app shell.
 */
export async function initServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator)) return;

  try {
    pwaUpdates.updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        pwaUpdates.notifyNeedRefresh();
      },
      onOfflineReady() {
        pwaUpdates.notifyOfflineReady();
      },
      onNeedReload() {
        // Intentionally handled by applyUpdate's explicit reload instead:
        // the plugin reloads here only when its register-time isUpdate flag
        // is true, and owning the single reload in activateAndReload avoids
        // both a missed reload and a double reload.
      },
      onRegisterError(error: unknown) {
        reportRegistrationError(error);
      },
    });
  } catch (error) {
    reportRegistrationError(error);
  }
}

/** Test seam: allows registering without the PROD guard. */
export function forceRegisterForTests(
  register: (options: { immediate: boolean }) => (reloadPage?: boolean) => Promise<void>,
): void {
  pwaUpdates.updateServiceWorker = register({ immediate: true });
}

/** Test seam: resets update state between tests. */
export function resetPwaUpdatesForTests(): void {
  pwaUpdates.updateServiceWorker = null;
  pwaUpdates.needRefresh = false;
  pwaUpdates.offlineReady = false;
}
