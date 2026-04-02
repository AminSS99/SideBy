import { supabase } from "@/lib/supabase/client";

export type AiRunStatus = "queued" | "running" | "completed" | "failed";

export interface AiRunRecord {
  id: string;
  workspace_id: string;
  project_id: string | null;
  user_id: string;
  provider: string;
  model: string;
  task_type: string;
  status: AiRunStatus;
  latency_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost: number | null;
  title: string | null;
  source: string;
  input_payload: Record<string, unknown>;
  output_summary: string | null;
  error_message: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateAiRunInput {
  workspaceId: string;
  projectId?: string | null;
  userId: string;
  provider: string;
  model: string;
  taskType: string;
  status: AiRunStatus;
  latencyMs?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  estimatedCost?: number | null;
  title?: string | null;
  source?: string;
  inputPayload?: Record<string, unknown>;
  outputSummary?: string | null;
  errorMessage?: string | null;
  completedAt?: string | null;
}

type UpdateAiRunInput = Partial<Omit<CreateAiRunInput, "workspaceId" | "userId">>;

export const createAiRun = async ({
  workspaceId,
  projectId,
  userId,
  provider,
  model,
  taskType,
  status,
  latencyMs = null,
  inputTokens = null,
  outputTokens = null,
  estimatedCost = null,
  title = null,
  source = "app",
  inputPayload = {},
  outputSummary = null,
  errorMessage = null,
  completedAt = null,
}: CreateAiRunInput) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("ai_runs")
    .insert({
      workspace_id: workspaceId,
      project_id: projectId ?? null,
      user_id: userId,
      provider,
      model,
      task_type: taskType,
      status,
      latency_ms: latencyMs,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost: estimatedCost,
      title,
      source,
      input_payload: inputPayload,
      output_summary: outputSummary,
      error_message: errorMessage,
      completed_at: completedAt,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as AiRunRecord;
};

export const updateAiRun = async (id: string, updates: UpdateAiRunInput) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const payload: Record<string, unknown> = {};

  if (updates.projectId !== undefined) payload.project_id = updates.projectId;
  if (updates.provider !== undefined) payload.provider = updates.provider;
  if (updates.model !== undefined) payload.model = updates.model;
  if (updates.taskType !== undefined) payload.task_type = updates.taskType;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.latencyMs !== undefined) payload.latency_ms = updates.latencyMs;
  if (updates.inputTokens !== undefined) payload.input_tokens = updates.inputTokens;
  if (updates.outputTokens !== undefined) payload.output_tokens = updates.outputTokens;
  if (updates.estimatedCost !== undefined) payload.estimated_cost = updates.estimatedCost;
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.source !== undefined) payload.source = updates.source;
  if (updates.inputPayload !== undefined) payload.input_payload = updates.inputPayload;
  if (updates.outputSummary !== undefined) payload.output_summary = updates.outputSummary;
  if (updates.errorMessage !== undefined) payload.error_message = updates.errorMessage;
  if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt;

  const { data, error } = await supabase
    .from("ai_runs")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as AiRunRecord;
};

export const listWorkspaceAiRuns = async (workspaceId: string, limit = 8) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("ai_runs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as AiRunRecord[];
};
