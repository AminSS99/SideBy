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

const vector = customType<{ data: number[]; driverData: string; config: { dimension: number } }>({
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
  "running",
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
    providerCustomerId: text("provider_customer_id"),
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
    providerCustomerId: text("provider_customer_id"),
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
    snapsolveWorkspaceId: uuid("snapsolve_workspace_id"),
    snapsolveWorkspaceSlug: text("snapsolve_workspace_slug"),
    snapsolveWorkspaceStatus: text("snapsolve_workspace_status"),
    snapsolveSyncError: text("snapsolve_sync_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("workspaces_owner_idx").on(table.ownerId),
    index("workspaces_slug_idx").on(table.slug),
    index("workspaces_snapsolve_workspace_idx").on(table.snapsolveWorkspaceId),
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
    taxonomyCategory: text("taxonomy_category").default("general_research").notNull(),
    taxonomyStatus: text("taxonomy_status").default("ready").notNull(),
    taxonomyConfidence: numeric("taxonomy_confidence", { precision: 4, scale: 3 }),
    safetyLevel: text("safety_level").default("standard").notNull(),
    policyNote: text("policy_note"),
    status: comparisonStatusEnum("status").default("queued").notNull(),
    visibility: visibilityEnum("visibility").default("private").notNull(),
    isFavorited: boolean("is_favorited").default(false).notNull(),
    folder: text("folder"),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    clerkUserId: text("clerk_user_id"),
    clerkOrgId: text("clerk_org_id"),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    slug: text("slug").notNull().unique(),
    progress: integer("progress").default(0).notNull(),
    activeStep: integer("active_step").default(0).notNull(),
    sourceCount: integer("source_count").default(0).notNull(),
    factsCount: integer("facts_count").default(0).notNull(),
    dimensionsCount: integer("dimensions_count").default(0).notNull(),
    overallConfidence: numeric("overall_confidence", { precision: 4, scale: 3 }),
    result: jsonb("result"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").default(0).notNull(),
    totalCost: numeric("total_cost", { precision: 10, scale: 6 }),
    aiTokensIn: integer("ai_tokens_in"),
    aiTokensOut: integer("ai_tokens_out"),
    searchesUsed: integer("searches_used").default(0),
    freshnessClass: text("freshness_class").default("medium"),
    reuseSourceId: uuid("reuse_source_id"),
    queryEmbedding: vector("query_embedding", { dimension: 1536 }),
    lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("comparisons_clerk_user_id_idx").on(table.clerkUserId),
    index("comparisons_clerk_user_favorited_idx").on(table.clerkUserId, table.isFavorited),
    index("comparisons_clerk_org_id_idx").on(table.clerkOrgId),
    index("comparisons_workspace_idx").on(table.workspaceId),
    index("comparisons_project_idx").on(table.projectId),
    index("comparisons_status_idx").on(table.status),
    index("comparisons_taxonomy_category_idx").on(table.taxonomyCategory),
    index("comparisons_safety_level_idx").on(table.safetyLevel),
    index("comparisons_slug_idx").on(table.slug),
  ],
);

// ─── Comparison Versions ───────────────────────────────────────────────────

export const comparisonVersions = pgTable(
  "comparison_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id")
      .notNull()
      .references(() => comparisons.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    result: jsonb("result"),
    sourceCount: integer("source_count").default(0).notNull(),
    overallConfidence: numeric("overall_confidence", { precision: 4, scale: 3 }),
    changeSummary: jsonb("change_summary").default({}).notNull(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("comparison_versions_comparison_idx").on(table.comparisonId),
    uniqueIndex("comparison_versions_number_idx").on(table.comparisonId, table.versionNumber),
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
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    description: text("description"),
    officialUrl: text("official_url"),
    logoUrl: text("logo_url"),
    logoSource: text("logo_source"),
    metadata: jsonb("metadata").default({}).notNull(),
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
    entityId: uuid("entity_id").references(() => comparisonEntities.id, { onDelete: "set null" }),
    url: text("url").notNull(),
    canonicalUrl: text("canonical_url"),
    title: text("title"),
    sourceType: text("source_type").default("web").notNull(),
    reliability: text("reliability").default("review").notNull(),
    extractionMethod: text("extraction_method").default("tavily").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
    snapshotPath: text("snapshot_path"),
    contentHash: text("content_hash"),
    metadata: jsonb("metadata").default({}).notNull(),
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
    entityId: uuid("entity_id").notNull().references(() => comparisonEntities.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => comparisonDimensions.id, { onDelete: "set null" }),
    sourceId: uuid("source_id").references(() => comparisonSources.id, { onDelete: "set null" }),
    entity: text("entity").notNull(),
    category: text("category").notNull(),
    label: text("label"),
    value: text("value").notNull(),
    normalizedValue: jsonb("normalized_value"),
    sourceUrl: text("source_url").notNull(),
    sourceTitle: text("source_title"),
    confidence: numeric("confidence", { precision: 3, scale: 2 }).notNull(),
    freshnessClass: text("freshness_class").default("product").notNull(),
    extractedAt: timestamp("extracted_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    previousValue: text("previous_value"),
    changedAt: timestamp("changed_at", { withTimezone: true }),
    embedding: vector("embedding", { dimension: 1536 }),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("comparison_facts_comparison_idx").on(table.comparisonId),
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
    verdictType: text("verdict_type").default("overall").notNull(),
    winnerEntityId: uuid("winner_entity_id").references(() => comparisonEntities.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    confidence: numeric("confidence", { precision: 4, scale: 3 }),
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
    promptHash: text("prompt_hash"),
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

// ─── Knowledge Base ─────────────────────────────────────────────────────────

export const knowledgeDocuments = pgTable(
  "knowledge_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    uploadedBy: text("uploaded_by").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    blobUrl: text("blob_url").notNull(),
    blobKey: text("blob_key").notNull(),
    status: text("status").default("indexing").notNull(),
    errorMessage: text("error_message"),
    chunkCount: integer("chunk_count").default(0).notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("knowledge_documents_workspace_idx").on(table.workspaceId),
    index("knowledge_documents_project_idx").on(table.projectId),
    index("knowledge_documents_workspace_project_status_idx").on(
      table.workspaceId,
      table.projectId,
      table.status,
    ),
    index("knowledge_documents_uploaded_by_idx").on(table.uploadedBy),
    index("knowledge_documents_blob_key_idx").on(table.blobKey),
  ],
);

export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    chunkIndex: integer("chunk_index").notNull(),
    text: text("text").notNull(),
    tokenEstimate: integer("token_estimate").notNull(),
    embedding: vector("embedding", { dimension: 1536 }).notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("knowledge_chunks_document_idx").on(table.documentId),
    index("knowledge_chunks_workspace_idx").on(table.workspaceId),
    index("knowledge_chunks_project_idx").on(table.projectId),
    index("knowledge_chunks_workspace_document_idx").on(table.workspaceId, table.documentId),
    uniqueIndex("knowledge_chunks_document_chunk_idx").on(table.documentId, table.chunkIndex),
  ],
);

// ─── Subscriptions ──────────────────────────────────────────────────────────

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    providerSubscriptionId: text("provider_subscription_id").notNull().unique(),
    providerPlanId: text("provider_plan_id").notNull(),
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
    index("subscriptions_provider_idx").on(table.providerSubscriptionId),
  ],
);

// ─── Durable User/Workspace Settings ───────────────────────────────────────

export const userSettings = pgTable(
  "user_settings",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    preferences: jsonb("preferences").default({}).notNull(),
    notificationPrefs: jsonb("notification_prefs").default({}).notNull(),
    defaultAiModel: text("default_ai_model"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

export const workspaceSettings = pgTable(
  "workspace_settings",
  {
    workspaceId: uuid("workspace_id")
      .primaryKey()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    branding: jsonb("branding").default({}).notNull(),
    defaultDimensions: jsonb("default_dimensions").default([]).notNull(),
    notificationPrefs: jsonb("notification_prefs").default({}).notNull(),
    defaultVisibility: visibilityEnum("default_visibility").default("private").notNull(),
    sharedKnowledgeBase: boolean("shared_knowledge_base").default(true).notNull(),
    updatedBy: text("updated_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

// ─── Developer API Keys ─────────────────────────────────────────────────────

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    keyHash: text("key_hash").notNull().unique(),
    scopes: jsonb("scopes").default([]).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("api_keys_user_idx").on(table.userId),
    index("api_keys_org_idx").on(table.organizationId),
    index("api_keys_workspace_idx").on(table.workspaceId),
    index("api_keys_prefix_idx").on(table.keyPrefix),
  ],
);

// ─── Prompt Studio ──────────────────────────────────────────────────────────

export const promptTemplates = pgTable(
  "prompt_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    createdBy: text("created_by").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    systemPrompt: text("system_prompt").notNull(),
    userPromptTemplate: text("user_prompt_template"),
    variablesSchema: jsonb("variables_schema").default({}).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("prompt_templates_workspace_idx").on(table.workspaceId),
    index("prompt_templates_org_idx").on(table.organizationId),
    index("prompt_templates_created_by_idx").on(table.createdBy),
  ],
);

// ─── Team Invitations ───────────────────────────────────────────────────────

export const teamInvitations = pgTable(
  "team_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: roleEnum("role").default("member").notNull(),
    status: text("status").default("pending").notNull(),
    clerkInvitationId: text("clerk_invitation_id"),
    invitedBy: text("invited_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("team_invitations_org_idx").on(table.organizationId),
    index("team_invitations_workspace_idx").on(table.workspaceId),
    index("team_invitations_email_idx").on(table.email),
  ],
);

// ─── Monitoring, Decision Matrices, Source Reliability ──────────────────────

export const watchlists = pgTable(
  "watchlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    comparisonId: uuid("comparison_id").references(() => comparisons.id, { onDelete: "cascade" }),
    createdBy: text("created_by").notNull(),
    name: text("name").notNull(),
    query: text("query").notNull(),
    cadence: text("cadence").default("weekly").notNull(),
    alertThreshold: numeric("alert_threshold", { precision: 4, scale: 3 }).default("0.100").notNull(),
    channels: jsonb("channels").default({}).notNull(),
    status: text("status").default("active").notNull(),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("watchlists_workspace_idx").on(table.workspaceId),
    index("watchlists_comparison_idx").on(table.comparisonId),
    index("watchlists_created_by_idx").on(table.createdBy),
    index("watchlists_next_run_idx").on(table.nextRunAt),
  ],
);

export const decisionMatrices = pgTable(
  "decision_matrices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id").references(() => comparisons.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    weights: jsonb("weights").default({}).notNull(),
    result: jsonb("result").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("decision_matrices_comparison_idx").on(table.comparisonId),
    index("decision_matrices_user_idx").on(table.userId),
  ],
);

export const sourceFeedback = pgTable(
  "source_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id").references(() => comparisons.id, { onDelete: "cascade" }),
    userId: text("user_id"),
    sourceUrl: text("source_url").notNull(),
    vote: integer("vote").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("source_feedback_comparison_idx").on(table.comparisonId),
    index("source_feedback_url_idx").on(table.sourceUrl),
  ],
);

// ─── Webhook Events ─────────────────────────────────────────────────────────

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(), // clerk, dodo
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

// ─── Query Analytics ─────────────────────────────────────────────────────────

export const queryAnalytics = pgTable(
  "query_analytics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    comparisonId: uuid("comparison_id").references(() => comparisons.id, { onDelete: "cascade" }),
    rawQuery: text("raw_query").notNull(),
    normalizedQuery: text("normalized_query"),
    canonicalSlug: text("canonical_slug"),
    detectedEntities: jsonb("detected_entities"),
    queryCategory: text("query_category"),
    taxonomyStatus: text("taxonomy_status"),
    safetyLevel: text("safety_level"),
    taxonomyConfidence: numeric("taxonomy_confidence", { precision: 4, scale: 3 }),
    policyNote: text("policy_note"),
    policySignals: jsonb("policy_signals"),
    sourceStrategy: jsonb("source_strategy"),
    isVague: boolean("is_vague").default(false),
    reusedFromId: uuid("reused_from_id"),
    totalCost: numeric("total_cost", { precision: 10, scale: 6 }),
    aiTokensIn: integer("ai_tokens_in"),
    aiTokensOut: integer("ai_tokens_out"),
    searchesUsed: integer("searches_used").default(0),
    sourcesFound: integer("sources_found").default(0),
    cacheHits: integer("cache_hits").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("qa_comparison_idx").on(table.comparisonId),
    index("qa_canonical_slug_idx").on(table.canonicalSlug),
    index("qa_query_category_idx").on(table.queryCategory),
    index("qa_taxonomy_status_idx").on(table.taxonomyStatus),
    index("qa_safety_level_idx").on(table.safetyLevel),
    index("qa_is_vague_idx").on(table.isVague),
    index("qa_created_at_idx").on(table.createdAt),
  ],
);

// ─── Entity Knowledge Base — Fact Reuse Across Comparisons ───────────────────

export const entityKnowledge = pgTable(
  "entity_knowledge",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entitySlug: text("entity_slug").notNull(),  // normalized entity name
    entityDisplayName: text("entity_display_name").notNull(),
    dimension: text("dimension").notNull(),
    value: text("value").notNull(),
    sourceUrl: text("source_url"),
    sourceTitle: text("source_title"),
    confidence: numeric("confidence", { precision: 3, scale: 2 }).notNull(),
    freshnessClass: text("freshness_class").default("medium"),
    usageCount: integer("usage_count").default(1),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ek_entity_slug_idx").on(table.entitySlug),
    index("ek_dimension_idx").on(table.dimension),
    index("ek_usage_count_idx").on(table.usageCount),
    uniqueIndex("ek_entity_dim_value_idx").on(table.entitySlug, table.dimension, table.value),
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

// ─── Webhook Subscriptions ──────────────────────────────────────────────────

export const webhookSubscriptions = pgTable(
  "webhook_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    secret: text("secret").notNull(),
    eventTypes: jsonb("event_types").default([]).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("webhook_subscriptions_user_idx").on(table.userId),
    index("webhook_subscriptions_org_idx").on(table.organizationId),
    index("webhook_subscriptions_workspace_idx").on(table.workspaceId),
  ],
);

// ─── SnapSolve Ecosystem Outbox ─────────────────────────────────────────────

export const snapSolveOutbox = pgTable(
  "snapsolve_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: text("event_id").notNull().unique(),
    eventType: text("event_type").notNull(),
    product: text("product").default("sideby").notNull(),
    clerkUserId: text("clerk_user_id"),
    productUserId: text("product_user_id"),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "set null" }),
    email: text("email"),
    metadata: jsonb("metadata").default({}).notNull(),
    status: text("status").default("queued").notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    lastError: text("last_error"),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).defaultNow().notNull(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("snapsolve_outbox_status_next_attempt_idx").on(table.status, table.nextAttemptAt),
    index("snapsolve_outbox_user_idx").on(table.clerkUserId),
  ],
);
