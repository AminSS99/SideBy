import type { VercelRequest, VercelResponse } from "@vercel/node";

// Comparison routes
import comparisonsIndex from "./_routes/comparisons/index.js";
import comparisonsBySlug from "./_routes/comparisons/by-slug/[slug].js";
import comparisonsId from "./_routes/comparisons/[id].js";
import comparisonsIdActions from "./_routes/comparisons/[id]/actions.js";
import comparisonsIdDiff from "./_routes/comparisons/[id]/diff.js";
import comparisonsIdManage from "./_routes/comparisons/[id]/manage.js";
import comparisonsIdVersions from "./_routes/comparisons/[id]/versions.js";
import comparisonsIdVisibility from "./_routes/comparisons/[id]/visibility.js";

// V1 routes
import v1ComparisonsIndex from "./_routes/v1/comparisons/index.js";
import v1ComparisonsId from "./_routes/v1/comparisons/[id].js";
import v1ComparisonsIdExport from "./_routes/v1/comparisons/[id]/export.js";
import v1ComparisonsIdFollowups from "./_routes/v1/comparisons/[id]/followups.js";

// Webhook routes
import webhooksClerk from "./_routes/webhooks/clerk.js";
import webhooksPaddle from "./_routes/webhooks/paddle.js";
import webhooksSubscriptions from "./_routes/webhooks/subscriptions.js";
import webhooksSubscriptionsId from "./_routes/webhooks/subscriptions/[id].js";

// Billing routes
import billingCheckout from "./_routes/billing/checkout.js";
import billingPortal from "./_routes/billing/portal.js";

// Other single routes
import accountHandler from "./_routes/account.js";
import apiKeysHandler from "./_routes/api-keys.js";
import apiKeysIdHandler from "./_routes/api-keys/[id].js";
import chatHandler from "./_routes/chat.js";
import csrfHandler from "./_routes/csrf.js";
import decisionMatricesHandler from "./_routes/decision-matrices.js";
import healthHandler from "./_routes/health.js";
import integrationsSlack from "./_routes/integrations/slack.js";
import jobsDrain from "./_routes/jobs/drain.js";
import knowledgeHandler from "./_routes/knowledge.js";
import openapiHandler from "./_routes/openapi.js";
import promptsHandler from "./_routes/prompts.js";
import searchHandler from "./_routes/search.js";
import seoSitemap from "./_routes/seo/sitemap.js";
import settingsHandler from "./_routes/settings.js";
import sourceFeedbackHandler from "./_routes/source-feedback.js";
import teamHandler from "./_routes/team.js";
import usageHandler from "./_routes/usage.js";
import watchlistsHandler from "./_routes/watchlists.js";
import watchlistsRunHandler from "./_routes/watchlists-run.js";
import workspaceHandler from "./_routes/workspace.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  console.log("API ROUTER MATCHED:", { url: request.url, query: request.query, pathParam: request.query.path });
  const pathParam = request.query.path || request.query['...path'];
  let path: string[] = [];
  if (Array.isArray(pathParam)) {
    path = pathParam;
  } else if (typeof pathParam === "string") {
    path = pathParam.split("/").filter(Boolean);
  }

  if (path.length === 0) {
    return response.status(404).json({ error: "Not found" });
  }

  const [segment0, segment1, segment2, segment3] = path;

  // Comparisons
  if (segment0 === "comparisons") {
    if (segment1 === "create") {
      return comparisonsIndex(request, response);
    }
    if (segment1 === "taxonomy") {
      request.query.action = "taxonomy";
      return comparisonsIndex(request, response);
    }
    if (segment1 === "by-slug" && segment2) {
      request.query.slug = segment2;
      return comparisonsBySlug(request, response);
    }
    if (segment1) {
      request.query.id = segment1;
      if (segment2 === "actions") return comparisonsIdActions(request, response);
      if (segment2 === "diff") return comparisonsIdDiff(request, response);
      if (segment2 === "manage") return comparisonsIdManage(request, response);
      if (segment2 === "versions") return comparisonsIdVersions(request, response);
      if (segment2 === "visibility") return comparisonsIdVisibility(request, response);
      return comparisonsId(request, response);
    }
    return comparisonsIndex(request, response);
  }

  // Workspaces / Projects
  if (segment0 === "workspaces") {
    request.query.resource = "workspaces";
    return workspaceHandler(request, response);
  }
  if (segment0 === "projects") {
    request.query.resource = "projects";
    return workspaceHandler(request, response);
  }

  // Knowledge base sub-routes
  if (segment0 === "knowledge") {
    if (segment1 === "documents") {
      if (segment2) {
        request.query.action = "document";
        request.query.id = segment2;
      } else {
        request.query.action = "documents";
      }
    } else if (segment1 === "upload") {
      request.query.action = "upload";
    } else if (segment1 === "search") {
      request.query.action = "search";
    }
    return knowledgeHandler(request, response);
  }

  // V1 API
  if (segment0 === "v1" && segment1 === "comparisons") {
    if (segment2) {
      request.query.id = segment2;
      if (segment3 === "export") return v1ComparisonsIdExport(request, response);
      if (segment3 === "followups") return v1ComparisonsIdFollowups(request, response);
      return v1ComparisonsId(request, response);
    }
    return v1ComparisonsIndex(request, response);
  }

  // Webhooks
  if (segment0 === "webhooks") {
    if (segment1 === "clerk") return webhooksClerk(request, response);
    if (segment1 === "paddle") return webhooksPaddle(request, response);
    if (segment1 === "subscriptions") {
      if (segment2) {
        request.query.id = segment2;
        return webhooksSubscriptionsId(request, response);
      }
      return webhooksSubscriptions(request, response);
    }
  }

  // Billing
  if (segment0 === "billing") {
    if (segment1 === "checkout") return billingCheckout(request, response);
    if (segment1 === "portal") return billingPortal(request, response);
  }

  // API Keys
  if (segment0 === "api-keys") {
    if (segment1) {
      request.query.id = segment1;
      return apiKeysIdHandler(request, response);
    }
    return apiKeysHandler(request, response);
  }

  // Single-segment routes
  const singleHandlers: Record<string, (req: VercelRequest, res: VercelResponse) => unknown> = {
    account: accountHandler,
    chat: chatHandler,
    csrf: csrfHandler,
    "decision-matrices": decisionMatricesHandler,
    health: healthHandler,
    knowledge: knowledgeHandler,
    openapi: openapiHandler,
    prompts: promptsHandler,
    search: searchHandler,
    settings: settingsHandler,
    "source-feedback": sourceFeedbackHandler,
    team: teamHandler,
    usage: usageHandler,
    watchlists: watchlistsHandler,
    "watchlists-run": watchlistsRunHandler,
    workspace: workspaceHandler,
  };

  if (segment1 === undefined && singleHandlers[segment0]) {
    return singleHandlers[segment0](request, response);
  }

  // Multi-segment single routes
  if (segment0 === "integrations" && segment1 === "slack") {
    return integrationsSlack(request, response);
  }
  if (segment0 === "jobs" && segment1 === "drain") {
    return jobsDrain(request, response);
  }
  if (segment0 === "seo" && segment1 === "sitemap") {
    return seoSitemap(request, response);
  }

  return response.status(404).json({ error: "Not found" });
}
