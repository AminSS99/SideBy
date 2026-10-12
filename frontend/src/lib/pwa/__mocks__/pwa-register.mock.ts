/**
 * Vitest stub for the `virtual:pwa-register` module provided by
 * vite-plugin-pwa at build time. Production code must always import the
 * real virtual module (statically, so Vite can resolve it); tests resolve
 * this stub through `vitest.config.ts` instead.
 */

export type RegisterSWOptions = {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegistered?: (registration: unknown) => void;
  onRegisterError?: (error: unknown) => void;
};

export function registerSW(_options?: RegisterSWOptions) {
  return async (_reloadPage?: boolean): Promise<void> => {};
}
