import React from "react";
import type { ComparisonTaxonomySummary } from "@/lib/comparisonTaxonomy";

export type EntityKey = "a" | "b";

export type Entity = {
  name: string;
  subtitle: string;
  mark: string;
  hex: string;
  logoUrl?: string;
};

export type ComparisonFact = {
  entity: EntityKey;
  label: string;
  value: string;
  source: string;
  sourceUrl: string;
  sourceTitle: string;
  confidence: number;
  freshness: "Fresh" | "Monitor" | "Stable";
  changed?: boolean;
  previousValue?: string;
};

export type Category = {
  name: string;
  winner: "a" | "b" | "tie";
  verdict: string;
  facts: ComparisonFact[];
};

export type ComparisonSource = {
  title: string;
  url: string;
  reliability: "Official" | "Docs" | "Community";
  sourceType?: string;
  extractionMethod?: string;
  fetchedAt: string;
  confidence?: number;
  contentHash?: string;
  summary?: string;
};

export type ComparisonTelemetry = {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  models: string[];
};

export type ComparisonActivityStep = {
  id: string;
  task: string;
  stepName: string;
  status: "queued" | "running" | "completed" | "failed" | string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  inputSummary: string | null;
  outputSummary: string | null;
  error: string | null;
  model?: string | null;
  estimatedCost?: number | null;
};

export type FollowUpEvidence = {
  id: string;
  label: string;
  value: string;
  confidence: number;
  similarity: number;
  sourceTitle: string | null;
  sourceUrl: string | null;
};

export type ComparisonData = {
  slug: string;
  query: string;
  context: string;
  taxonomy?: ComparisonTaxonomySummary;
  entities: { a: Entity; b: Entity };
  sourceCount: number;
  updatedAt: string;
  verdict: {
    bestOverall: string;
    bestValue: string;
    developers: string;
    teams: string;
    students: string;
    powerUsers: string;
    ecosystem?: string;
    summary: string;
  };
  dimensions: Array<{ subject: string; a: number; b: number; fullMark: number }>;
  consensus: string[];
  contradictions: string[];
  categories: Category[];
  sources: ComparisonSource[];
  telemetry?: ComparisonTelemetry;
};

export type ResearchStep = {
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
};
