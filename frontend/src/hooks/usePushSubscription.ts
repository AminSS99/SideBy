import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { buildApiUrl, envConfig } from "@/config/env";

export type PushPermissionState = "unsupported" | "default" | "granted" | "denied";

interface PushStatusResponse {
  configured: boolean;
  publicVapidKey: string | null;
  devices: Array<{ endpoint: string }>;
}

interface SubscribeResponse {
  subscription?: { endpoint: string };
  removed?: number;
  sent?: number;
  failed?: number;
  error?: string;
}

interface UsePushSubscriptionState {
  permission: PushPermissionState;
  /** Current device has an active browser subscription… */
  subscribed: boolean;
  /** …that is also registered server-side. */
  registeredOnServer: boolean;
  deviceCount: number;
  isLoading: boolean;
  isWorking: boolean;
  error: string | null;
  enableNotifications: () => Promise<void>;
  disableThisDevice: () => Promise<void>;
  disableAllDevices: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

const APPLICATION_SERVER_KEY_CACHE = new Map<string, Uint8Array>();

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const cached = APPLICATION_SERVER_KEY_CACHE.get(base64String);
  if (cached) return cached;

  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  APPLICATION_SERVER_KEY_CACHE.set(base64String, outputArray);
  return outputArray;
}

/**
 * Feature detection. Notifications require: secure context, service worker,
 * PushManager, the Notification API and a VAPID application server key.
 */
export function detectPushSupport(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    window.isSecureContext
  );
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    // The generated SW may still be installing on first load.
    return (
      (await navigator.serviceWorker.getRegistration()) ??
      (await navigator.serviceWorker.ready.catch(() => null))
    );
  } catch {
    return null;
  }
}

async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) return null;
  try {
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/** Best-effort cleanup used on logout so this device stops receiving pushes for the account. */
export async function unsubscribeCurrentDevice(): Promise<void> {
  try {
    const subscription = await getCurrentSubscription();
    if (!subscription) return;

    await apiFetch(buildApiUrl("/api/push/unsubscribe"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
  } catch {
    // Logout must never be blocked by push cleanup.
  }
}

export function usePushSubscription(enabled: boolean): UsePushSubscriptionState {
  const [permission, setPermission] = useState<PushPermissionState>(() =>
    detectPushSupport() ? (Notification.permission as PushPermissionState) : "unsupported",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [registeredOnServer, setRegisteredOnServer] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverVapidKey, setServerVapidKey] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshStatus = useCallback(async () => {
    if (!detectPushSupport()) {
      setPermission("unsupported");
      setIsLoading(false);
      return;
    }

    setPermission(Notification.permission as PushPermissionState);

    try {
      const response = await apiFetch(buildApiUrl("/api/push/status"));
      const data = (await response.json()) as PushStatusResponse;

      if (!mountedRef.current) return;

      setServerVapidKey(data.publicVapidKey);
      setDeviceCount(data.devices?.length ?? 0);

      const current = await getCurrentSubscription();
      setSubscribed(!!current);
      setRegisteredOnServer(
        !!current && (data.devices ?? []).some((device) => device.endpoint === current.endpoint),
      );
    } catch (statusError) {
      if (!mountedRef.current) return;
      setError(
        statusError instanceof Error ? statusError.message : "Unable to load notification settings.",
      );
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void refreshStatus();
  }, [enabled, refreshStatus]);

  // React to the user changing permission outside our controls.
  useEffect(() => {
    if (!detectPushSupport() || typeof Notification === "undefined") return;
    const interval = window.setInterval(() => {
      setPermission((current) => {
        const live = Notification.permission as PushPermissionState;
        return live === current ? current : live;
      });
    }, 2000);
    return () => window.clearInterval(interval);
  }, []);

  const resolveApplicationServerKey = useCallback(async (): Promise<Uint8Array | null> => {
    const key = envConfig.vapidPublicKey || serverVapidKey || "";
    if (!key) return null;
    return urlBase64ToUint8Array(key);
  }, [serverVapidKey]);

  /**
   * Explicit user intent only: this is the ONLY place where notification
   * permission is ever requested.
   */
  const enableNotifications = useCallback(async () => {
    setError(null);

    if (!detectPushSupport()) {
      setError("This browser does not support push notifications.");
      return;
    }

    setIsWorking(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult as PushPermissionState);

      if (permissionResult === "denied") {
        setError(
          "Notifications are blocked for this site. Enable them in your browser's site settings, then try again.",
        );
        return;
      }
      if (permissionResult !== "granted") {
        setError("Notification permission was not granted.");
        return;
      }

      const applicationServerKey = await resolveApplicationServerKey();
      if (!applicationServerKey) {
        setError("Push keys are not configured yet. Try again shortly.");
        return;
      }

      const registration = await getServiceWorkerRegistration();
      if (!registration) {
        setError("The app is still initializing. Try again in a moment.");
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      const response = await apiFetch(buildApiUrl("/api/push/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as SubscribeResponse;
        throw new Error(payload.error || "Unable to register this device.");
      }

      setSubscribed(true);
      setRegisteredOnServer(true);
      setDeviceCount((count) => count + 1);
      toast.success("Notifications enabled", {
        description: "We'll alert you when research completes or needs attention.",
      });
    } catch (enableError) {
      const message =
        enableError instanceof Error ? enableError.message : "Unable to enable notifications.";
      setError(message);
      toast.error("Could not enable notifications", { description: message });
      void refreshStatus();
    } finally {
      setIsWorking(false);
    }
  }, [refreshStatus, resolveApplicationServerKey]);

  const disableThisDevice = useCallback(async () => {
    setIsWorking(true);
    setError(null);
    try {
      const subscription = await getCurrentSubscription();
      if (subscription) {
        await apiFetch(buildApiUrl("/api/push/unsubscribe"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => undefined);
        await subscription.unsubscribe().catch(() => undefined);
      }
      setSubscribed(false);
      setRegisteredOnServer(false);
      setDeviceCount((count) => Math.max(0, count - 1));
      toast.success("Notifications disabled on this device.");
      void refreshStatus();
    } finally {
      setIsWorking(false);
    }
  }, [refreshStatus]);

  const disableAllDevices = useCallback(async () => {
    setIsWorking(true);
    setError(null);
    try {
      const response = await apiFetch(buildApiUrl("/api/push/unsubscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!response.ok) {
        throw new Error("Unable to disable notifications everywhere.");
      }
      const subscription = await getCurrentSubscription();
      await subscription?.unsubscribe().catch(() => undefined);
      setSubscribed(false);
      setRegisteredOnServer(false);
      setDeviceCount(0);
      toast.success("Notifications disabled on all devices.");
    } catch (disableAllError) {
      setError(disableAllError instanceof Error ? disableAllError.message : "Something went wrong.");
    } finally {
      setIsWorking(false);
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    setIsWorking(true);
    setError(null);
    try {
      const response = await apiFetch(buildApiUrl("/api/push/test"), { method: "POST" });
      const data = (await response.json()) as SubscribeResponse;
      if (!response.ok) {
        throw new Error(data.error || "Test notification failed.");
      }
      toast.success(`Test sent to ${data.sent ?? 0} device(s).`, {
        description: "Look for the message labeled [SideBy Test].",
      });
    } catch (testError) {
      const message =
        testError instanceof Error ? testError.message : "Unable to send test notification.";
      setError(message);
      toast.error("Test failed", { description: message });
    } finally {
      setIsWorking(false);
    }
  }, []);

  return {
    permission,
    subscribed,
    registeredOnServer,
    deviceCount,
    isLoading,
    isWorking,
    error,
    enableNotifications,
    disableThisDevice,
    disableAllDevices,
    sendTestNotification,
  };
}
