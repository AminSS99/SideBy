import { and, eq, inArray, or } from "drizzle-orm";
import { createDbClient } from "../../src/db/index.js";
import { organizations, subscriptions, users } from "../../src/db/schema.js";
import { checkSnapSolveEntitlement, resolveSnapSolveWorkspaceSession } from "./snapsolve-core.js";
import { logger } from "./log.js";

export type BillingPlan = "free" | "pro" | "team" | "business";
export type SubscriptionSource =
  | "snapsolve_entitlement"
  | "snapsolve_workspace"
  | "local_org"
  | "local_subscription"
  | "free_fallback";

export type SubscriptionFeature =
  | "comparison"
  | "followUp"
  | "refresh"
  | "export"
  | "watchlist"
  | "chat"
  | "knowledgeUpload"
  | "team";

export type SubscriptionState = {
  plan: BillingPlan;
  source: SubscriptionSource;
  status: "active" | "trialing" | "inactive" | "unknown";
  isUnlimited: boolean;
  billingConfigured: boolean;
  billingProvider: "dodo" | "snapsolve" | "none";
  entitlement: {
    allowed: boolean;
    feature: string;
    plan: string | null;
    reason: string | null;
    source: string | null;
    workspaceId: string | null;
  } | null;
  snapsolveWorkspace: {
    id: string;
    name: string;
    slug: string | null;
    plan: string | null;
  } | null;
  limits: SubscriptionLimits;
  message: string;
};

export type SubscriptionLimits = {
  comparisonsPerDay: number;
  followUpsPerDay: number;
  refreshesPerDay: number;
  exportsPerDay: number;
  watchlistsPerDay: number;
};

const UNLIMITED = Number.MAX_SAFE_INTEGER;

export function getFreeLimits(): SubscriptionLimits {
  return {
    comparisonsPerDay: Number(process.env.FREE_COMPARISONS_PER_DAY || "5"),
    followUpsPerDay: Number(process.env.FREE_FOLLOWUPS_PER_DAY || "10"),
    refreshesPerDay: Number(process.env.FREE_REFRESHES_PER_DAY || "3"),
    exportsPerDay: Number(process.env.FREE_EXPORTS_PER_DAY || "10"),
    watchlistsPerDay: Number(process.env.FREE_WATCHLISTS_PER_DAY || "5"),
  };
}

export function getPlanLimits(plan: BillingPlan): SubscriptionLimits {
  if (plan !== "free") {
    return {
      comparisonsPerDay: UNLIMITED,
      followUpsPerDay: UNLIMITED,
      refreshesPerDay: UNLIMITED,
      exportsPerDay: UNLIMITED,
      watchlistsPerDay: UNLIMITED,
    };
  }

  return getFreeLimits();
}

export function normalizePlan(productId?: string | null): BillingPlan {
  if (!productId) return "free";
  if (productId === process.env.DODO_PRO_PRODUCT_ID) return "pro";
  if (productId === process.env.DODO_TEAM_PRODUCT_ID) return "team";
  if (productId === process.env.DODO_ENTERPRISE_PRODUCT_ID) return "business";
  return "free";
}

export function isBillingConfigured() {
  const dodoReady = Boolean(
    process.env.DODO_PAYMENTS_API_KEY &&
      (process.env.DODO_PRO_PRODUCT_ID || process.env.DODO_TEAM_PRODUCT_ID || process.env.DODO_ENTERPRISE_PRODUCT_ID),
  );
  const snapsolveReady = Boolean(process.env.SNAPSOLVE_CORE_URL && process.env.SNAPSOLVE_SIDEBY_SECRET);
  return {
    billingConfigured: dodoReady || snapsolveReady,
    billingProvider: dodoReady ? "dodo" as const : snapsolveReady ? "snapsolve" as const : "none" as const,
  };
}

export function mapSnapSolvePlan(plan: string | null | undefined): BillingPlan {
  switch ((plan || "").toLowerCase()) {
    case "pulse":
    case "pro":
      return "pro";
    case "core":
    case "team":
      return "team";
    case "orbit":
    case "enterprise":
    case "business":
      return "business";
    default:
      return "free";
  }
}

function normalizeLocalPlan(plan: string | null | undefined): BillingPlan {
  if (plan === "pro" || plan === "team" || plan === "business") return plan;
  return "free";
}

function buildState(args: {
  plan: BillingPlan;
  source: SubscriptionSource;
  status?: SubscriptionState["status"];
  entitlement?: SubscriptionState["entitlement"];
  snapsolveWorkspace?: SubscriptionState["snapsolveWorkspace"];
}): SubscriptionState {
  const billing = isBillingConfigured();
  const limits = getPlanLimits(args.plan);
  const isUnlimited = args.plan !== "free";

  return {
    plan: args.plan,
    source: args.source,
    status: args.status ?? (isUnlimited ? "active" : "unknown"),
    isUnlimited,
    ...billing,
    entitlement: args.entitlement ?? null,
    snapsolveWorkspace: args.snapsolveWorkspace ?? null,
    limits,
    message: isUnlimited
      ? "Your paid SnapSolve workspace limits are active."
      : "You are on the free SideBy plan.",
  };
}

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const db = createDbClient();
    const [row] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return row?.email ?? null;
  } catch (error) {
    logger.warn("Unable to load user email for subscription resolution", {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return null;
  }
}

async function resolveSnapSolveState(args: {
  userId: string;
  email: string | null;
  feature: SubscriptionFeature;
}): Promise<SubscriptionState | null> {
  const entitlement = await checkSnapSolveEntitlement({
    clerkUserId: args.userId,
    email: args.email,
    feature: args.feature,
  });

  if (entitlement) {
    const plan = mapSnapSolvePlan(entitlement.plan);
    return buildState({
      plan,
      source: "snapsolve_entitlement",
      status: entitlement.allowed ? "active" : "inactive",
      entitlement: {
        allowed: entitlement.allowed,
        feature: entitlement.feature,
        plan: entitlement.plan,
        reason: entitlement.reason ?? null,
        source: entitlement.source,
        workspaceId: entitlement.workspace_id,
      },
    });
  }

  const session = await resolveSnapSolveWorkspaceSession({
    clerkUserId: args.userId,
    email: args.email,
  });

  const workspace = session?.workspace ?? null;
  const sidebyProduct = session?.products.find((product) => product.slug === "sideby");
  if (!workspace && !sidebyProduct?.entitlement) return null;

  const rawPlan = sidebyProduct?.entitlement?.plan ?? workspace?.plan ?? null;
  return buildState({
    plan: mapSnapSolvePlan(rawPlan),
    source: "snapsolve_workspace",
    status: sidebyProduct?.entitlement?.allowed === false ? "inactive" : "active",
    entitlement: sidebyProduct?.entitlement
      ? {
          allowed: sidebyProduct.entitlement.allowed,
          feature: "*",
          plan: sidebyProduct.entitlement.plan,
          reason: sidebyProduct.entitlement.reason,
          source: sidebyProduct.entitlement.source,
          workspaceId: workspace?.id ?? null,
        }
      : null,
    snapsolveWorkspace: workspace,
  });
}

async function resolveLocalState(userId: string, orgId: string | null): Promise<SubscriptionState> {
  const db = createDbClient();

  if (orgId) {
    const [org] = await db
      .select({ plan: organizations.plan })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const orgPlan = normalizeLocalPlan(org?.plan);
    if (orgPlan !== "free") {
      return buildState({ plan: orgPlan, source: "local_org", status: "active" });
    }
  }

  const rows = await db
    .select({ status: subscriptions.status, planId: subscriptions.providerPlanId })
    .from(subscriptions)
    .where(
      and(
        inArray(subscriptions.status, ["active", "trialing"]),
        orgId
          ? or(eq(subscriptions.organizationId, orgId), eq(subscriptions.userId, userId))
          : eq(subscriptions.userId, userId),
      ),
    )
    .limit(1);

  if (rows.length > 0) {
    const plan = normalizePlan(rows[0].planId);
    return buildState({
      plan,
      source: "local_subscription",
      status: rows[0].status === "trialing" ? "trialing" : "active",
    });
  }

  return buildState({ plan: "free", source: "free_fallback", status: "unknown" });
}

export async function resolveSubscriptionState(args: {
  userId: string | null;
  orgId?: string | null;
  feature?: SubscriptionFeature;
}): Promise<SubscriptionState> {
  if (!args.userId) {
    return buildState({ plan: "free", source: "free_fallback", status: "unknown" });
  }

  const email = await getUserEmail(args.userId);
  const snapsolveState = await resolveSnapSolveState({
    userId: args.userId,
    email,
    feature: args.feature ?? "comparison",
  });
  if (snapsolveState) return snapsolveState;

  return resolveLocalState(args.userId, args.orgId ?? null);
}
