/**
 * AUTHORED BUT NOT EXECUTED — deferred-testing batch (LAUNCH-01).
 * Do not claim these pass. Run with the project's API test configuration.
 *
 * Adversarial publication contract (v3): publication is denied unless
 * (1) the SERVER wrote the record's input scope as an authorized public
 * snapshot, (2) server-written evidence proves pipeline research with
 * retrievable citations, and (3) every public claim corresponds to the
 * pipeline's own source inventory. The stored JSON's own `provenance`
 * claim is never trusted; attribution never implies factual truth or live
 * source accessibility.
 */
import { describe, it, expect } from "vitest";
import {
  assessPublishEligibility,
  correspondsToInventory,
  normalizeCitationUrl,
  type ServerEvidence,
} from "../public-eligibility.js";

const citedResult = {
  provenance: "illustrative", // deliberately untrusted: must be ignored
  categories: [
    {
      name: "Pricing",
      facts: [
        { entity: "a", sourceUrl: "https://example.com/pricing" },
        { entity: "b", sourceUrl: "https://example.org/pricing" },
      ],
    },
  ],
  verdict: { summary: "A leads on pricing." },
  sources: [{ url: "https://example.com/pricing" }],
};

const verifiedEvidence: ServerEvidence = {
  inputScope: "public",
  pipelineRunPresent: true,
  citedFactCount: 2,
  uncitedFactCount: 0,
  sourceInventory: ["https://example.com/pricing", "https://example.org/pricing"],
};

describe("input authorization (no silent grandfathering)", () => {
  it("denies a record the server did not generate as an authorized public snapshot", () => {
    const assessment = assessPublishEligibility(citedResult, {
      ...verifiedEvidence,
      inputScope: "unknown",
    });
    expect(assessment.eligible).toBe(false);
    expect(assessment.classification).toBe("not-public-input");
    expect(assessment.reasons.join(" ")).toContain("private");
  });

  it("denies records with a missing input scope (unknown-origin) — even if published historically", () => {
    const assessment = assessPublishEligibility(citedResult, {
      ...verifiedEvidence,
      inputScope: null,
    });
    expect(assessment.eligible).toBe(false);
    expect(assessment.classification).toBe("not-public-input");
  });

  it("never accepts client or JSON claims about input scope", () => {
    const result = {
      ...citedResult,
      inputScope: "public", // payload says so; the DB column said otherwise
    };
    const assessment = assessPublishEligibility(result, {
      ...verifiedEvidence,
      inputScope: "unknown",
    });
    expect(assessment.eligible).toBe(false);
  });

  it("does not sacrifice classification names for the launch demo", () => {
    // A built-from-brief record stays denied even when looking perfectly
    // researched; a public example must be generated through the snapshot
    // path instead.
    const assessment = assessPublishEligibility(citedResult, {
      ...verifiedEvidence,
      inputScope: "unknown",
    });
    expect(assessment.eligible).toBe(false);
    expect(assessment.classification).toBe("not-public-input");
  });
});

describe("claim ↔ source-inventory correspondence", () => {
  it("denies claims citing a URL that is not part of the research inventory", () => {
    const result = {
      ...citedResult,
      categories: [
        {
          name: "Pricing",
          facts: [{ entity: "a", sourceUrl: "https://unrelated.example/anything" }],
        },
      ],
    };
    const assessment = assessPublishEligibility(result, {
      ...verifiedEvidence,
      citedFactCount: 1,
    });
    expect(assessment.eligible).toBe(false);
    expect(assessment.classification).toBe("uncorresponded");
  });

  it("denies unrelated domains that contain an inventory URL as a substring", () => {
    // Unrelated domains or subdomain attacks must not match via substring containment
    expect(
      correspondsToInventory("https://evil-example.com/pricing", ["https://example.com/pricing"]),
    ).toBe(false);
    expect(
      correspondsToInventory("https://example.com.attacker.org/pricing", ["https://example.com/pricing"]),
    ).toBe(false);
    expect(
      correspondsToInventory("https://example.com/pricing", ["https://example.com/pricing/en-US/x"]),
    ).toBe(false);
  });

  it("accepts parsed, normalized URL equality across slashes, casing and hash fragments", () => {
    expect(
      correspondsToInventory("https://EXAMPLE.com/pricing", ["https://example.com/pricing"]),
    ).toBe(true);
    expect(
      correspondsToInventory("https://example.com/pricing/", ["https://example.com/pricing"]),
    ).toBe(true);
    expect(
      correspondsToInventory("https://example.com/pricing#section", ["https://example.com/pricing"]),
    ).toBe(true);
    expect(
      correspondsToInventory("https://example.com/pricing?a=1&b=2", ["https://example.com/pricing?b=2&a=1"]),
    ).toBe(true);
  });

  it("preserves URL host and port: different ports compare unequal and do not match", () => {
    // Different ports represent distinct services/endpoints and must never compare equal
    expect(normalizeCitationUrl("https://example.com:8080/pricing")).toBe("https://example.com:8080/pricing");
    expect(normalizeCitationUrl("https://example.com:8080/pricing")).not.toBe(
      normalizeCitationUrl("https://example.com/pricing"),
    );
    expect(
      correspondsToInventory("https://example.com:8080/pricing", ["https://example.com:8443/pricing"]),
    ).toBe(false);
    expect(
      correspondsToInventory("https://example.com:8080/pricing", ["https://example.com/pricing"]),
    ).toBe(false);
    expect(
      correspondsToInventory("https://example.com:8080/pricing", ["https://example.com:8080/pricing"]),
    ).toBe(true);
    expect(
      correspondsToInventory("https://EXAMPLE.COM:8080/pricing", ["https://example.com:8080/pricing"]),
    ).toBe(true);
  });

  it("asserts correspondence is attribution lineage, not URL liveness or truth", () => {
    // A dead or unresolvable source still corresponds; the gate tests lineage.
    expect(correspondsToInventory("https://example.com/pricing", ["https://example.com/pricing"])).toBe(true);
  });

  it("conducts the payload check against table inventory, not just in-payload sources", () => {
    const result = {
      ...citedResult,
      // payload sources list the citation, but the pipeline inventory lacks it
      sources: [{ url: "https://in-payload.example/claim" }],
      categories: [
        { name: "Pricing", facts: [{ entity: "a", sourceUrl: "https://in-payload.example/claim" }] },
      ],
    };
    const assessment = assessPublishEligibility(result, {
      ...verifiedEvidence,
      citedFactCount: 1,
      sourceInventory: ["https://example.com/pricing"],
    });
    expect(assessment.eligible).toBe(false);
  });
});

describe("pipeline provenance gate", () => {
  it("allows verified pipeline research with cited claims", () => {
    const assessment = assessPublishEligibility(citedResult, verifiedEvidence);
    expect(assessment.eligible).toBe(true);
    expect(assessment.classification).toBe("verified-research");
    expect(Object.keys(assessment)).not.toContain("provenance"); // payload claim never re-exported
  });

  it("denies when no server-side pipeline run exists, whatever the JSON claims", () => {
    const assessment = assessPublishEligibility(citedResult, {
      ...verifiedEvidence,
      pipelineRunPresent: false,
    });
    expect(assessment.eligible).toBe(false);
    expect(assessment.classification).toBe("not-pipeline");
  });

  it("denies when a single retained claim is unattributable", () => {
    const assessment = assessPublishEligibility(citedResult, {
      ...verifiedEvidence,
      uncitedFactCount: 1,
    });
    expect(assessment.eligible).toBe(false);
    expect(assessment.classification).toBe("unattributed");
  });

  it("denies when the payload itself carries an un-cited claim", () => {
    const result = {
      ...citedResult,
      categories: [
        {
          name: "Pricing",
          facts: [{ entity: "a", sourceUrl: "#" }],
        },
      ],
    };
    const assessment = assessPublishEligibility(result, verifiedEvidence);
    expect(assessment.eligible).toBe(false);
  });

  it("denies unsafe citation schemes even with pipeline evidence", () => {
    const result = {
      ...citedResult,
      categories: [
        {
          name: "Pricing",
          facts: [{ entity: "a", sourceUrl: "javascript:alert(1)" }],
        },
      ],
    };
    const assessment = assessPublishEligibility(result, verifiedEvidence);
    expect(assessment.eligible).toBe(false);
  });

  it("never lets a stored 'researched' claim substitute for evidence", () => {
    const assessment = assessPublishEligibility(
      { ...citedResult, provenance: "researched" },
      {
        inputScope: "public",
        pipelineRunPresent: false,
        citedFactCount: 0,
        uncitedFactCount: 0,
        sourceInventory: [],
      },
    );
    expect(assessment.eligible).toBe(false);
  });

  it("denies incomplete records", () => {
    const assessment = assessPublishEligibility(
      { ...citedResult, verdict: {} },
      verifiedEvidence,
    );
    expect(assessment.eligible).toBe(false);
    expect(assessment.classification).toBe("incomplete");
  });

  it("denies missing records as unknown", () => {
    const assessment = assessPublishEligibility(null, verifiedEvidence);
    expect(assessment.eligible).toBe(false);
    expect(assessment.classification).toBe("unknown");
  });

  it("adversarial: denies publication of a record derived from a private brief even when all citations are valid public URLs", () => {
    // Adversarial scenario: an attacker or user has a comparison with a confidential
    // internal brief ("React vs Vue for Project Confidential internal code-name"),
    // but the extracted facts cite real public documentation.
    // Proving the facts are real URLs does NOT prove the record is safe to publish.
    const confidentialResult = {
      ...citedResult,
      query: "React vs Vue for internal project Falcon",
      context: "Confidential roadmap and private IP requirements",
      verdict: {
        summary: "For project Falcon, React satisfies internal compliance constraints.",
      },
    };

    // The database column inputScope was NOT 'public' (e.g. 'unknown' or private-derived)
    const assessment = assessPublishEligibility(confidentialResult, {
      ...verifiedEvidence,
      inputScope: "unknown",
    });

    expect(assessment.eligible).toBe(false);
    expect(assessment.classification).toBe("not-public-input");
    expect(assessment.reasons.some((r) => r.includes("private"))).toBe(true);
  });
});
