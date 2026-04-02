import { supabase } from "@/lib/supabase/client";

export interface ProjectRecord {
  id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateProjectInput {
  workspaceId: string;
  createdBy: string;
  name: string;
  description?: string;
}

export const listWorkspaceProjects = async (workspaceId: string) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ProjectRecord[];
};

export const createWorkspaceProject = async ({
  workspaceId,
  createdBy,
  name,
  description,
}: CreateProjectInput) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: workspaceId,
      created_by: createdBy,
      name,
      description: description?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as ProjectRecord;
};
