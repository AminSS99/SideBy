import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export interface WorkspaceRecord {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "team" | "business";
  created_at: string;
  updated_at: string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const buildDefaultWorkspaceName = (user: User) => {
  const base = user.user_metadata?.full_name || user.email?.split("@")[0] || "SideBy Workspace";
  return `${base} Workspace`;
};

const buildDefaultWorkspaceSlug = (user: User) => {
  const base = user.email?.split("@")[0] || user.id.slice(0, 8);
  return `${slugify(base)}-${user.id.slice(0, 8)}`;
};

export const ensureWorkspaceBootstrap = async (user: User) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: user.user_metadata?.full_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw profileError;
  }

  const { data: ownedWorkspaces, error: workspaceLookupError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  if (workspaceLookupError) {
    throw workspaceLookupError;
  }

  if (ownedWorkspaces && ownedWorkspaces.length > 0) {
    return ownedWorkspaces as WorkspaceRecord[];
  }

  const workspacePayload = {
    owner_id: user.id,
    name: buildDefaultWorkspaceName(user),
    slug: buildDefaultWorkspaceSlug(user),
    plan: "free" as const,
  };

  const { data: workspaceInsert, error: workspaceInsertError } = await supabase
    .from("workspaces")
    .insert(workspacePayload)
    .select("*")
    .single();

  if (workspaceInsertError) {
    throw workspaceInsertError;
  }

  const { error: membershipError } = await supabase.from("workspace_memberships").insert({
    workspace_id: workspaceInsert.id,
    user_id: user.id,
    role: "owner",
  });

  if (membershipError) {
    throw membershipError;
  }

  return [workspaceInsert as WorkspaceRecord];
};

export const listMemberWorkspaces = async () => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as WorkspaceRecord[];
};
