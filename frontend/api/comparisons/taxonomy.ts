import { sendJson } from "../_lib/sideby.js";
import { SUPPORTED_COMPARISON_CATEGORIES } from "../../src/lib/comparisonTaxonomy.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
  maxDuration: 10,
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== "GET") {
    return sendJson(response, { error: "Method not allowed" }, 405);
  }

  return sendJson(response, {
    categories: SUPPORTED_COMPARISON_CATEGORIES.map((category) => ({
      id: category.id,
      label: category.label,
      shortLabel: category.shortLabel,
      description: category.description,
      examples: category.examples,
      blockedExamples: category.blockedExamples,
      dimensions: category.defaultDimensions,
      sourceRequirements: category.sourceRequirements,
      disclaimer: category.disclaimer,
      safetyLevel: category.safetyLevel,
      freshnessClass: category.freshnessClass,
    })),
  });
}
