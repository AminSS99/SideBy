// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://sideby.ink"}
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const sdk = vi.hoisted(() => ({ init: vi.fn(), opt_in_capturing: vi.fn(), capture: vi.fn(), identify: vi.fn(), reset: vi.fn(), opt_out_capturing: vi.fn() }));
vi.mock('posthog-js', () => ({ default: sdk }));
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks(); vi.unstubAllEnvs();
  vi.stubEnv('PROD', true); vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test');
  vi.stubEnv('VITE_POSTHOG_HOST', 'https://eu.i.posthog.com');
});
afterEach(() => vi.unstubAllGlobals());
describe('production analytics boundary', () => {
  it('initializes after consent on the production site', async () => {
    const { initPostHog } = await import('./posthog'); initPostHog();
    expect(sdk.init).toHaveBeenCalledWith('phc_test', expect.objectContaining({ api_host: 'https://eu.i.posthog.com' }));
  });
  it('cannot re-enable production capture in development', async () => {
    vi.stubEnv('PROD', false);
    const { initPostHog, captureEvent } = await import('./posthog'); initPostHog(); initPostHog(); captureEvent('test');
    expect(sdk.init).not.toHaveBeenCalled(); expect(sdk.opt_in_capturing).not.toHaveBeenCalled(); expect(sdk.capture).not.toHaveBeenCalled();
  });
  it('does not initialize on preview domains even in a production build', async () => {
    vi.stubGlobal('window', { location: { hostname: 'sideby-preview.vercel.app' } });
    const { initPostHog } = await import('./posthog'); initPostHog();
    expect(sdk.init).not.toHaveBeenCalled();
  });
  it('requires an explicit ingestion host', async () => {
    vi.stubEnv('VITE_POSTHOG_HOST', ''); vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', '');
    const { initPostHog } = await import('./posthog'); initPostHog();
    expect(sdk.init).not.toHaveBeenCalled();
  });
});
