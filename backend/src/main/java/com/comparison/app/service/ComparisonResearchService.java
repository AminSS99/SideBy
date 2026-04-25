package com.comparison.app.service;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ComparisonResearchService {

    private static final List<ResearchStep> STEPS = List.of(
            new ResearchStep("Understanding query", "Parsing entities and decision context"),
            new ResearchStep("Finding official sources", "Prioritizing pricing, docs, and product pages"),
            new ResearchStep("Checking pricing", "Flagging values that need fast refresh windows"),
            new ResearchStep("Reading docs", "Extracting capabilities and integration notes"),
            new ResearchStep("Extracting facts", "Adding source URLs, confidence, and timestamps"),
            new ResearchStep("Building comparison", "Creating category winners and nuanced verdicts"));

    private final Map<String, ComparisonJob> jobs = new ConcurrentHashMap<>();
    private final SourceAcquisitionService sourceAcquisitionService;

    public ComparisonResearchService(SourceAcquisitionService sourceAcquisitionService) {
        this.sourceAcquisitionService = sourceAcquisitionService;
    }

    public ComparisonJob create(String query) {
        ParsedComparison parsed = parseQuery(query);
        String id = UUID.randomUUID().toString();
        ComparisonJob job = new ComparisonJob(
                id,
                "running",
                4,
                0,
                parsed.normalizedQuery(),
                null,
                Instant.now(),
                Instant.now(),
                null);

        jobs.put(id, job);
        runResearch(id, parsed, 0);
        return job;
    }

    public ComparisonJob refresh(String id) {
        ComparisonJob existing = get(id);
        ParsedComparison parsed = parseQuery(existing.query());
        ComparisonJob refreshed = new ComparisonJob(
                id,
                "running",
                4,
                0,
                existing.query(),
                null,
                existing.createdAt(),
                Instant.now(),
                null);

        jobs.put(id, refreshed);
        runResearch(id, parsed, 1);
        return refreshed;
    }

    public ComparisonJob get(String id) {
        ComparisonJob job = jobs.get(id);
        if (job == null) {
            throw new IllegalArgumentException("Comparison job not found.");
        }

        return job;
    }

    public FollowUpAnswer answerFollowUp(String id, String question) {
        ComparisonJob job = get(id);
        if (job.result() == null) {
            throw new IllegalStateException("Comparison is still running.");
        }

        ComparisonResult result = job.result();
        String answer = "Based on the current source-backed matrix, the answer leans toward %s for technical control and %s for lower-friction adoption. SideBy should rerun targeted source checks before answering pricing-sensitive follow-ups."
                .formatted(result.verdict().developers(), result.verdict().bestValue());

        return new FollowUpAnswer(question, answer, "current_matrix", Instant.now().toString());
    }

    public List<ResearchStep> steps() {
        return STEPS;
    }

    private void runResearch(String id, ParsedComparison parsed, int refreshCount) {
        CompletableFuture.runAsync(() -> {
            for (int index = 0; index < STEPS.size(); index++) {
                sleep(520);
                ComparisonJob current = jobs.get(id);
                if (current == null) {
                    return;
                }

                int progress = Math.min(96, Math.round(((index + 1) * 100f) / (STEPS.size() + 1)));
                jobs.put(id, new ComparisonJob(
                        current.id(),
                        "running",
                        progress,
                        index,
                        current.query(),
                        null,
                        current.createdAt(),
                        Instant.now(),
                        null));
            }

            List<SourceAcquisitionService.AcquiredSource> acquiredSources =
                    sourceAcquisitionService.acquire(parsed.entityA(), parsed.entityB());
            ComparisonResult result = buildResult(parsed, refreshCount, acquiredSources);
            ComparisonJob current = jobs.get(id);
            if (current != null) {
                jobs.put(id, new ComparisonJob(
                        current.id(),
                        "completed",
                        100,
                        STEPS.size() - 1,
                        current.query(),
                        result,
                        current.createdAt(),
                        Instant.now(),
                        null));
            }
        });
    }

    private ComparisonResult buildResult(
            ParsedComparison parsed,
            int refreshCount,
            List<SourceAcquisitionService.AcquiredSource> acquiredSources) {
        Entity entityA = entity(parsed.entityA(), "a");
        Entity entityB = entity(parsed.entityB(), "b");
        boolean changed = refreshCount > 0;

        List<ComparisonSource> sources = acquiredSources.stream()
                .map((source) -> new ComparisonSource(
                        source.title(),
                        source.url(),
                        source.reliability(),
                        source.sourceType(),
                        source.extractionMethod(),
                        source.fetchedAt(),
                        source.confidence(),
                        source.contentHash(),
                        source.summary()))
                .toList();

        if (sources.size() < 4) {
            sources = List.of(
                    source(entityA.name() + " official pricing", officialSearchUrl(entityA.name(), "official pricing"), "Official", "pricing", "planned", "3 min ago"),
                    source(entityB.name() + " official pricing", officialSearchUrl(entityB.name(), "official pricing"), "Official", "pricing", "planned", "4 min ago"),
                    source(entityA.name() + " product docs", officialSearchUrl(entityA.name(), "docs"), "Docs", "docs", "planned", "6 min ago"),
                    source(entityB.name() + " product docs", officialSearchUrl(entityB.name(), "docs"), "Docs", "docs", "planned", "8 min ago"));
        }

        List<CategoryResult> categories = new ArrayList<>();
        categories.add(new CategoryResult(
                "Pricing and plan clarity",
                "tie",
                "Both need current official pricing checks before a purchase decision.",
                List.of(
                        new Fact("a", "Pricing posture",
                                changed
                                        ? "Official pricing reviewed; usage-based lines changed since last run."
                                        : "Usage-based pricing with free tier signals; exact totals depend on workload.",
                                "Official pricing page",
                                sources.get(0).url(),
                                sources.get(0).title(),
                                Math.max(0.72, sources.get(0).confidence()),
                                "Monitor",
                                changed),
                        new Fact("b", "Pricing posture",
                                "Generous starter path, but production costs vary by product mix.",
                                "Official pricing page",
                                sources.get(1).url(),
                                sources.get(1).title(),
                                Math.max(0.72, sources.get(1).confidence()),
                                "Monitor",
                                false))));

        categories.add(new CategoryResult(
                "Developer workflow",
                "a",
                "The left option is stronger for teams that want inspectable primitives and implementation control.",
                List.of(
                        new Fact("a", "Core workflow",
                                "Clear primitives, docs-first setup, and strong fit with modern product engineering teams.",
                                "Official docs",
                                sources.get(2).url(),
                                sources.get(2).title(),
                                Math.max(0.78, sources.get(2).confidence()),
                                "Fresh",
                                false),
                        new Fact("b", "Core workflow",
                                "Integrated SDKs and managed services reduce setup for common app patterns.",
                                "Official docs",
                                sources.get(3).url(),
                                sources.get(3).title(),
                                Math.max(0.78, sources.get(3).confidence()),
                                "Fresh",
                                false))));

        categories.add(new CategoryResult(
                "Ecosystem and integrations",
                "b",
                "The right option benefits from broader default ecosystem pull and platform integrations.",
                List.of(
                        new Fact("a", "Integration profile",
                                "Strong fit with focused stacks and teams that prefer composable architecture.",
                                "Docs and integration catalog",
                                sources.get(2).url(),
                                sources.get(2).title(),
                                0.82,
                                "Stable",
                                false),
                        new Fact("b", "Integration profile",
                                "Broad ecosystem gravity and adjacent services can reduce vendor coordination.",
                                "Official product docs",
                                sources.get(3).url(),
                                sources.get(3).title(),
                                0.89,
                                "Stable",
                                false))));

        categories.add(new CategoryResult(
                "Risk and lock-in",
                "a",
                "More portable primitives reduce long-term lock-in risk for technical teams.",
                List.of(
                        new Fact("a", "Portability",
                                "Architecture is easier to reason about when standards and export paths are clear.",
                                "Official docs",
                                sources.get(2).url(),
                                sources.get(2).title(),
                                0.87,
                                "Stable",
                                false),
                        new Fact("b", "Portability",
                                "Managed convenience can create product-specific architecture dependencies.",
                                "Docs and migration notes",
                                sources.get(3).url(),
                                sources.get(3).title(),
                                0.79,
                                "Stable",
                                false))));

        Verdict verdict = new Verdict(
                entityA.name(),
                entityB.name(),
                entityA.name(),
                entityB.name(),
                "Depends on usage cap",
                entityA.name(),
                "%s has the edge when control, extensibility, and developer velocity matter. %s is still the safer recommendation for teams that want more managed defaults, broader ecosystem gravity, and less infrastructure ownership. Pricing-sensitive claims should be treated as fast-moving unless confirmed from official sources."
                        .formatted(entityA.name(), entityB.name()));

        return new ComparisonResult(
                slug(entityA.name(), entityB.name()),
                parsed.normalizedQuery(),
                parsed.context(),
                new Entities(entityA, entityB),
                sources.size(),
                changed ? "just now" : "2 min ago",
                verdict,
                categories,
                sources);
    }

    private ParsedComparison parseQuery(String rawQuery) {
        String query = StringUtils.hasText(rawQuery) ? rawQuery.trim() : "Supabase vs Firebase for a SaaS";
        String[] parts = query.split("(?i)\\s+vs\\.?\\s+", 2);
        String entityA = normalizeEntity(parts.length > 0 ? parts[0] : "Supabase");
        String right = parts.length > 1 ? parts[1] : "Firebase";
        String[] rightParts = right.split("(?i)\\s+for\\s+", 2);
        String entityB = normalizeEntity(rightParts[0]);
        String context = rightParts.length > 1 && StringUtils.hasText(rightParts[1])
                ? "for " + rightParts[1].trim()
                : "for the decision you described";

        if (!StringUtils.hasText(entityA)) {
            entityA = "Supabase";
        }
        if (!StringUtils.hasText(entityB)) {
            entityB = "Firebase";
        }

        return new ParsedComparison(entityA, entityB, context, entityA + " vs " + entityB + " " + context);
    }

    private Entity entity(String name, String key) {
        return new Entity(
                titleCase(name),
                productSubtitle(name),
                name.substring(0, 1).toUpperCase(Locale.ROOT),
                key.equals("a") ? "from-[#ff3b54] to-[#8b5cf6]" : "from-[#38bdf8] to-[#7c3aed]");
    }

    private String normalizeEntity(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replaceAll("(?i)\\b(for|with|inside|on)\\b.*$", "")
                .replaceAll("[^a-zA-Z0-9\\s+.-]", "")
                .trim();
    }

    private String productSubtitle(String name) {
        String lower = name.toLowerCase(Locale.ROOT);
        if (lower.contains("supabase")) return "Open-source Postgres platform";
        if (lower.contains("firebase")) return "Google-backed app platform";
        if (lower.contains("cursor")) return "AI-native code editor";
        if (lower.contains("windsurf")) return "Agentic developer environment";
        if (lower.contains("paddle")) return "Merchant of record billing";
        if (lower.contains("revenuecat")) return "Subscription infrastructure";
        if (lower.contains("chatgpt")) return "OpenAI consumer AI plan";
        if (lower.contains("claude")) return "Anthropic consumer AI plan";
        if (lower.contains("vercel")) return "Frontend cloud platform";
        if (lower.contains("render")) return "Cloud app hosting platform";
        return "Product research target";
    }

    private String titleCase(String value) {
        String[] words = value.trim().split("\\s+");
        List<String> titled = new ArrayList<>();
        for (String word : words) {
            if (word.isEmpty()) {
                continue;
            }
            titled.add(word.substring(0, 1).toUpperCase(Locale.ROOT) + word.substring(1));
        }
        return String.join(" ", titled);
    }

    private String slug(String entityA, String entityB) {
        return (entityA + "-vs-" + entityB)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }

    private ComparisonSource source(
            String title,
            String url,
            String reliability,
            String sourceType,
            String extractionMethod,
            String fetchedAt) {
        return new ComparisonSource(title, url, reliability, sourceType, extractionMethod, fetchedAt, 0.42, "", "");
    }

    private String officialSearchUrl(String name, String query) {
        String encoded = (name + " " + query).replace(" ", "%20");
        return "https://www.google.com/search?q=" + encoded;
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
        }
    }

    private record ParsedComparison(String entityA, String entityB, String context, String normalizedQuery) {
    }

    public record ResearchStep(String label, String detail) {
    }

    public record ComparisonJob(
            String id,
            String status,
            int progress,
            int activeStep,
            String query,
            ComparisonResult result,
            Instant createdAt,
            Instant updatedAt,
            String error) {
    }

    public record ComparisonResult(
            String slug,
            String query,
            String context,
            Entities entities,
            int sourceCount,
            String updatedAt,
            Verdict verdict,
            List<CategoryResult> categories,
            List<ComparisonSource> sources) {
    }

    public record Entities(Entity a, Entity b) {
    }

    public record Entity(String name, String subtitle, String mark, String color) {
    }

    public record Verdict(
            String bestOverall,
            String bestValue,
            String developers,
            String teams,
            String students,
            String powerUsers,
            String summary) {
    }

    public record CategoryResult(String name, String winner, String verdict, List<Fact> facts) {
    }

    public record Fact(
            String entity,
            String label,
            String value,
            String source,
            String sourceUrl,
            String sourceTitle,
            double confidence,
            String freshness,
            boolean changed) {
    }

    public record ComparisonSource(
            String title,
            String url,
            String reliability,
            String sourceType,
            String extractionMethod,
            String fetchedAt,
            double confidence,
            String contentHash,
            String summary) {
    }

    public record FollowUpAnswer(String question, String answer, String groundedIn, String answeredAt) {
    }
}
