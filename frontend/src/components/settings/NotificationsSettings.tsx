import { BellToggle } from "@/components/ui/bell-toggle";
import { Bell, BellOff, CheckCircle2, LoaderCircle, Send, ShieldAlert, Smartphone, XCircle } from "@/components/icons";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { GlowCard } from "@/components/GlowCard";

/**
 * Notification settings with explicit Enable/Disable controls. Permission is
 * NEVER requested automatically — only when the user clicks Enable.
 */
export function NotificationsSettings() {
  const { user } = useAuth();
  const {
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
  } = usePushSubscription(!!user);

  if (!user || isLoading) {
    return (
      <div className="rounded-sm border border-[#2a2a2a] bg-[#111] p-8 text-sm text-[#fdfbf7]/50">
        <span className="inline-flex items-center gap-3">
          <LoaderCircle className="h-4 w-4 animate-spin text-orange-500" />
          Loading notification settings…
        </span>
      </div>
    );
  }

  const isEnabled = subscribed && registeredOnServer;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlowCard className="p-8" glowColor="rgba(249, 115, 22, 0.15)">
        <div className="mb-6 flex items-center gap-3 border-b border-[#2a2a2a] pb-5">
          <Bell className="h-5 w-5 text-orange-400" />
          <h2 className="font-serif text-2xl text-[#fdfbf7]">Push Notifications</h2>
        </div>

        <p className="text-sm leading-relaxed text-[#fdfbf7]/55">
          Get notified the moment a comparison finishes — or when research fails and needs your attention.
          SideBy never sends notifications for progress updates.
        </p>

        {error && (
          <div role="alert" className="mt-5 flex items-start gap-3 rounded-sm border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300">
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {permission === "unsupported" && (
          <div className="mt-5 flex items-start gap-3 rounded-sm border border-[#333] bg-[#0c0b0a] p-4 text-sm text-[#fdfbf7]/50">
            <BellOff className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Push notifications are not supported in this browser or context. Try a recent version of
              Chrome, Edge, Firefox, or Samsung Internet on a secure connection.
            </span>
          </div>
        )}

        {permission === "denied" && (
          <div className="mt-5 flex items-start gap-3 rounded-sm border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-200">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Notifications are blocked</p>
              <p className="mt-1 leading-relaxed text-amber-200/80">
                Your browser is blocking notifications for this site. Open the padlock icon in your address
                bar (or your browser&apos;s site settings), allow notifications, then reload this page.
              </p>
            </div>
          </div>
        )}

        {isEnabled && (
          <div className="mt-5 flex items-start gap-3 rounded-sm border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Notifications are enabled on this device.{" "}
              {deviceCount > 1 && `${deviceCount} devices receive alerts for this account.`}
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {(isEnabled || (permission !== "denied" && permission !== "unsupported")) && (
            <BellToggle pressed={isEnabled} busy={isWorking}
              offLabel="Enable Notifications" onLabel="Notifications on · Disable"
              onChange={(enabled) => { void (enabled ? enableNotifications() : disableThisDevice()); }} />
          )}

          {isEnabled && (
            <>
              {deviceCount > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Disable push notifications on all ${deviceCount} devices?`)) {
                      void disableAllDevices();
                    }
                  }}
                  disabled={isWorking}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-red-500/30 bg-red-500/5 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <BellOff className="h-3.5 w-3.5" />
                  Disable Everywhere
                </button>
              )}
              <button
                type="button"
                onClick={() => void sendTestNotification()}
                disabled={isWorking}
                title="Sends one message labeled [SideBy Test]"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-orange-500/25 bg-orange-500/[0.08] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-orange-300 transition-colors hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                Send Test Notification
              </button>
            </>
          )}
        </div>

        {subscribed && !registeredOnServer && (
          <p className="mt-4 text-xs text-amber-300/80">
            This device has a browser subscription but it is not registered with your account yet.
            Click Enable Notifications again to re-register it.
          </p>
        )}
      </GlowCard>

      <GlowCard className="p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-[#2a2a2a] pb-5">
          <Smartphone className="h-5 w-5 text-cyan-400" />
          <h2 className="font-serif text-2xl text-[#fdfbf7]">What you&apos;ll be notified about</h2>
        </div>
        <ul className="space-y-3 text-sm leading-relaxed text-[#fdfbf7]/60">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-400" />
            A comparison you started completes successfully.
          </li>
          <li className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-400" />
            Research fails after automatic retries and needs your attention.
          </li>
          <li className="flex items-start gap-3">
            <Send className="mt-1 h-3.5 w-3.5 shrink-0 text-cyan-400" />
            Test notifications that you explicitly request (labeled [SideBy Test]).
          </li>
        </ul>
        <p className="mt-5 border-t border-[#2a2a2a] pt-4 text-xs leading-relaxed text-[#fdfbf7]/35">
          Tapping a notification opens the exact comparison it refers to. Signed-out devices stop receiving
          notifications immediately.
        </p>
      </GlowCard>
    </div>
  );
}
