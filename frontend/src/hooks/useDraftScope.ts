import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { DraftScope } from "@/lib/pwa/register";

/**
 * Resolves the draft identity for PWA preservation.
 *
 * - While auth or workspace state is still loading, scope is null and
 *   callers must not restore (loading must never look like anonymous).
 * - Signed-out sessions use an explicit anonymous partition that is never
 *   migrated into an authenticated session.
 */
export function useDraftScope(): { scope: DraftScope | null; isReady: boolean } {
  const { user, isLoading: authLoading } = useAuth();
  const { activeWorkspace, isLoading: workspaceLoading } = useWorkspace();

  return useMemo(() => {
    if (authLoading || workspaceLoading) return { scope: null, isReady: false };
    if (!user) return { scope: { userId: null, workspaceId: null, anonymous: true }, isReady: true };
    return {
      scope: { userId: user.id, workspaceId: activeWorkspace?.id ?? null, anonymous: false },
      isReady: true,
    };
  }, [authLoading, workspaceLoading, user, activeWorkspace?.id]);
}
