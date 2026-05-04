import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  numeric,
  index,
  uniqueIndex,
  varchar,
  pgEnum,
  customType,
} from "drizzle-orm/pg-core";

// ─── Custom Types ───────────────────────────────────────────────────────────

const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config) {
    return `vector(${config?.dimension ?? 1536})`;
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

// ─── Enums ──────────────────────────────────────────────────────────────────

export const comparisonStatusEnum = pgEnum("comparison_status", [
  "queued",
  "researching",
  "completed",
  "failed",
]);

export const visibilityEnum = pgEnum("visibility", [
  "private",
  "team",
  "public",
]);

export const planEnum = pgEnum("plan", [
  "free",
  "pro",
  "team",
  "business",
]);

export const roleEnum = pgEnum("role", [
  "owner",
  "admin",
  "member",
  "viewer",
]);

export const sourceReliabilityEnum = pgEnum("source_reliability", [
  "official",
  "docs",
  "pricing",
  "statistics",
  "review",
  "news",
  "encyclopedia",
  "database",
]);

export const aiRunStatusEnum = pgEnum("ai_run_status", [
  "queued",
  "running",
  "completed",
  "failed",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "paused",
  "trialing",
]);

// ─── Users (Clerk mirror) ───────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // Clerk user id
    email: text("email"),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("users_email_idx").on(table.email)],
);

// ─── Organizations (Clerk org mirror) ───────────────────────────────────────

export const organizations = pgTable(
  "organizations",
  {
    id: text("id").primaryKey(), // Clerk org id
    slug: text("slug").notNull().unique(),
    name: text("name"),
    plan: planEnum("plan").default("free").notNull(),
    paddleCustomerId: text("paddle_customer_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("organizations_slug_idx").on(table.slug)],
);

// ─── Memberships ────────────────────────────────────────────────────────────

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: roleEnum("role").default("member").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("memberships_user_org_idx").on(table.userId, table.organizationId),
  ],
);

// ─── Workspaces ─────────────────────────────────────────────────────────────

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(), // user id or org id
    ownerType: varchar("owner_type", { length: 16 }).notNull().default("user"), // 'user' | 'org'
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    plan: planEnum("plan").default("free").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("workspaces_owner_idx").on(table.ownerId),
    index("workspaces_slug_idx").on(table.slug),
  ],
);

// ─── Projects ───────────────────────────────────────────────────────────────

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    createdBy: text("created_by").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("projects_workspace_idx").on(table.workspaceId),
  ],
);

// ─── Comparisons ────────────────────────────────────────────────────────────

export const comparisons = pgTable(
  "comparisons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    query: text("query").notNull(),
    mode: text("mode").default("default"), // default, multi, chat
    status: comparisonStatusEnum("status").default("queued").notNull(),
    visibility: visibilityEnum("visibility").default("private").notNull(),
    clerkUserId: text("clerk_user_id"),
    clerkOrgId: text("clerk_org_id"),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    slug: text("slug").notNull().unique(),
    progress: integer("progress").default(0).notNull(),
    activeStep: integer("active_step").default(0).notNull(),
    sourceCount: integer("source_count").default(0).notNull(),
    overallConfidence: numeric("overall_confidence", { precision: 4, scale: 3 }),
    result: jsonb("result"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").default(0).notNull(),
    lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("comparisons_clerk_user_id_idx").on(table.clerkUserId),
    index("comparisons_clerk_org_id_idx").on(table.clerkOrgId),
    index("comparisons_workspace_idx").on(table.workspaceId),
    index("comparisons_project_idx").on(table.projectId),
    index("comparisons_status_idx").on(table.status),
    index("comparisons_slug_idx").on(table.slug),
  ],
);

// ─── Comparison Entities ────────────────────────────────────────────────────

export const comparisonEntities = pgTable(
  "comparison_entities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id")
      .notNull()
      .references(() => comparisons.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    normalizedName: text("normalized_name").notNull(),
    aliases: text("aliases").array(),
    detectedType: text("detected_type"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("comparison_entities_comparison_idx").on(table.comparisonId),
  ],
);

// ─── Comparison Dimensions ──────────────────────────────────────────────────

export const comparisonDimensions = pgTable(
  "comparison_dimensions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id")
      .notNull()
      .references(() => comparisons.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    weight: numeric("weight", { precision: 3, scale: 2 }).default("1.00"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("comparison_dimensions_comparison_idx").on(table.comparisonId),
  ],
);

// ─── Comparison Sources ─────────────────────────────────────────────────────

export const comparisonSources = pgTable(
  "comparison_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id")
      .notNull()
      .references(() => comparisons.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title"),
    sourceType: text("source_type"),
    reliability: sourceReliabilityEnum("reliability"),
    extractionStatus: text("extraction_status").default("pending"),
    contentHash: text("content_hash"),
    summary: text("summary"),
    reliabilityScore: numeric("reliability_score", { precision: 3, scale: 2 }).default("0.70"), // 0.5-1.0 weight for scoring
    fetchedAt: timestamp("fetched_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("comparison_sources_comparison_idx").on(table.comparisonId),
    index("comparison_sources_url_idx").on(table.url),
  ],
);

// ─── Comparison Facts ───────────────────────────────────────────────────────

export const comparisonFacts = pgTable(
  "comparison_facts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id")
      .notNull()
      .references(() => comparisons.id, { onDelete: "cascade" }),
    entityId: uuid("entity_id").references(() => comparisonEntities.id, { onDelete: "cascade" }),
    dimensionId: uuid("dimension_id").references(() => comparisonDimensions.id, { onDelete: "cascade" }),
    value: text("value"),
    confidence: numeric("confidence", { precision: 3, scale: 2 }),
    citationSourceId: uuid("citation_source_id").references(() => comparisonSources.id, { onDelete: "set null" }),
    factHash: text("fact_hash"), // sha256(entity + dimension + normalized value) for dedupe
    embedding: vector("embedding", { dimension: 1536 }), // pgvector for semantic search
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("comparison_facts_comparison_idx").on(table.comparisonId),
    index("comparison_facts_hash_idx").on(table.factHash),
    index("comparison_facts_embedding_idx").on(table.embedding),
  ],
);

// ─── Comparison Scores ──────────────────────────────────────────────────────

export const comparisonScores = pgTable(
  "comparison_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id")
      .notNull()
      .references(() => comparisons.id, { onDelete: "cascade" }),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => comparisonEntities.id, { onDelete: "cascade" }),
    dimensionId: uuid("dimension_id")
      .notNull()
      .references(() => comparisonDimensions.id, { onDelete: "cascade" }),
    score: numeric("score", { precision: 4, scale: 2 }),
    rationale: text("rationale"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("comparison_scores_comparison_idx").on(table.comparisonId),
  ],
);

// ─── Comparison Verdicts ────────────────────────────────────────────────────

export const comparisonVerdicts = pgTable(
  "comparison_verdicts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id")
      .notNull()
      .references(() => comparisons.id, { onDelete: "cascade" }),
    overallVerdict: text("overall_verdict"),
    personaWinners: jsonb("persona_winners"), // { student: "X", founder: "Y" }
    tradeoffs: text("tradeoffs"),
    confidence: numeric("confidence", { precision: 4, scale: 3 }),
    caveats: text("caveats"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("comparison_verdicts_comparison_idx").on(table.comparisonId),
  ],
);

// ─── Comparison Questions ───────────────────────────────────────────────────

export const comparisonQuestions = pgTable(
  "comparison_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id")
      .notNull()
      .references(() => comparisons.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer"),
    groundedIn: text("grounded_in"),
    answeredAt: timestamp("answered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("comparison_questions_comparison_idx").on(table.comparisonId),
  ],
);

// ─── AI Runs ────────────────────────────────────────────────────────────────

export const aiRuns = pgTable(
  "ai_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id").references(() => comparisons.id, { onDelete: "set null" }),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    task: text("task").notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    estimatedCost: numeric("estimated_cost", { precision: 10, scale: 6 }),
    latencyMs: integer("latency_ms"),
    status: aiRunStatusEnum("status").default("queued").notNull(),
    inputPayload: jsonb("input_payload"),
    outputPayload: jsonb("output_payload"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ai_runs_comparison_idx").on(table.comparisonId),
    index("ai_runs_status_idx").on(table.status),
  ],
);

// ─── AI Run Steps ───────────────────────────────────────────────────────────

export const aiRunSteps = pgTable(
  "ai_run_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    aiRunId: uuid("ai_run_id")
      .notNull()
      .references(() => aiRuns.id, { onDelete: "cascade" }),
    stepName: text("step_name").notNull(), // search, extract, rank, reason, score, render
    status: text("status").default("pending").notNull(),
    inputSnapshot: jsonb("input_snapshot"),
    outputSnapshot: jsonb("output_snapshot"),
    errorTrace: text("error_trace"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ai_run_steps_ai_run_idx").on(table.aiRunId),
  ],
);

// ─── Usage Events ───────────────────────────────────────────────────────────

export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id"),
    clerkOrgId: text("clerk_org_id"),
    eventType: text("event_type").notNull(), // comparison, search, scrape, token, export
    quantity: integer("quantity").default(1).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("usage_events_user_idx").on(table.clerkUserId),
    index("usage_events_org_idx").on(table.clerkOrgId),
    index("usage_events_type_idx").on(table.eventType),
    index("usage_events_created_at_idx").on(table.createdAt),
  ],
);

// ─── Rate Limit Events ──────────────────────────────────────────────────────

export const rateLimitEvents = pgTable(
  "rate_limit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    keyType: text("key_type").notNull(), // user, ip, org
    keyValue: text("key_value").notNull(),
    limitName: text("limit_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("rate_limit_events_key_idx").on(table.keyType, table.keyValue),
    index("rate_limit_events_created_at_idx").on(table.createdAt),
  ],
);

// ─── Subscriptions ──────────────────────────────────────────────────────────

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    paddleSubscriptionId: text("paddle_subscription_id").notNull().unique(),
    paddlePlanId: text("paddle_plan_id").notNull(),
    status: subscriptionStatusEnum("status").default("trialing").notNull(),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("subscriptions_org_idx").on(table.organizationId),
    index("subscriptions_user_idx").on(table.userId),
    index("subscriptions_paddle_idx").on(table.paddleSubscriptionId),
  ],
);

// ─── Webhook Events ─────────────────────────────────────────────────────────

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(), // clerk, paddle
    eventType: text("event_type").notNull(),
    payload: jsonb("payload"),
    signatureValid: boolean("signature_valid").default(false),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("webhook_events_provider_idx").on(table.provider),
    index("webhook_events_created_at_idx").on(table.createdAt),
  ],
);

// ─── Feedback ───────────────────────────────────────────────────────────────

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id").references(() => comparisons.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id"),
    rating: integer("rating"), // 1-5
    correction: text("correction"),
    sourceReport: text("source_report"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("feedback_comparison_idx").on(table.comparisonId),
  ],
);

// ─── Audit Logs ─────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id"),
    clerkOrgId: text("clerk_org_id"),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(), // workspace, comparison, billing, etc.
    resourceId: text("resource_id"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_user_idx").on(table.clerkUserId),
    index("audit_logs_org_idx").on(table.clerkOrgId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);
