package com.comparison.app.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class SourceAcquisitionService {

    private static final int MAX_CONTENT_CHARS = 12_000;
    private static final String USER_AGENT = "SideByBot/0.1 (+https://snapsolve.ink)";

    @Value("${firecrawl.api.key:}")
    private String firecrawlApiKey;

    @Value("${firecrawl.api.url:https://api.firecrawl.dev/v2/scrape}")
    private String firecrawlApiUrl;

    private final RestClient restClient;

    public SourceAcquisitionService() {
        this.restClient = RestClient.create();
    }

    public List<AcquiredSource> acquire(String entityA, String entityB) {
        List<SourceCandidate> entityASources = planOfficialSources(entityA);
        List<SourceCandidate> entityBSources = planOfficialSources(entityB);
        List<SourceCandidate> candidates = new ArrayList<>();
        candidates.add(entityASources.get(0));
        candidates.add(entityBSources.get(0));
        candidates.add(entityASources.get(1));
        candidates.add(entityBSources.get(1));

        return candidates.stream()
                .map(this::extract)
                .toList();
    }

    private List<SourceCandidate> planOfficialSources(String entity) {
        OfficialSourceSet sourceSet = officialSourceSet(entity);
        if (sourceSet != null) {
            return List.of(
                    new SourceCandidate(entity + " official pricing", sourceSet.pricingUrl(), "Official", "pricing", true),
                    new SourceCandidate(entity + " product docs", sourceSet.docsUrl(), "Docs", "docs", true));
        }

        return List.of(
                new SourceCandidate(
                        entity + " official pricing",
                        "https://www.google.com/search?q=" + encode(entity + " official pricing"),
                        "Official",
                        "pricing",
                        false),
                new SourceCandidate(
                        entity + " product docs",
                        "https://www.google.com/search?q=" + encode(entity + " official docs"),
                        "Docs",
                        "docs",
                        false));
    }

    private AcquiredSource extract(SourceCandidate candidate) {
        if (candidate.directUrl() && isFirecrawlConfigured()) {
            try {
                return scrapeWithFirecrawl(candidate);
            } catch (Exception firecrawlError) {
                System.err.println("Firecrawl extraction failed for " + candidate.url() + ": " + firecrawlError.getMessage());
            }
        }

        if (candidate.directUrl()) {
            try {
                return scrapeWithJsoup(candidate);
            } catch (Exception jsoupError) {
                System.err.println("Jsoup extraction failed for " + candidate.url() + ": " + jsoupError.getMessage());
            }
        }

        return new AcquiredSource(
                candidate.title(),
                candidate.url(),
                candidate.reliability(),
                candidate.sourceType(),
                candidate.directUrl() && isFirecrawlConfigured() ? "firecrawl_failed" : "planned",
                "just now",
                "",
                "",
                candidate.directUrl() ? 0.58 : 0.42,
                candidate.directUrl() ? "Extraction pending or unavailable." : "Search provider not configured; official URL discovery pending.");
    }

    private AcquiredSource scrapeWithFirecrawl(SourceCandidate candidate) {
        Map<String, Object> requestBody = Map.of(
                "url", candidate.url(),
                "formats", List.of("markdown"),
                "onlyMainContent", true,
                "removeBase64Images", true,
                "timeout", 30000);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri(firecrawlApiUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + firecrawlApiKey)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        Map<String, Object> data = readMap(response, "data");
        Map<String, Object> metadata = readMap(data, "metadata");
        String markdown = truncate(readString(data, "markdown"));
        String title = firstText(readString(metadata, "title"), candidate.title());
        String canonicalUrl = firstText(readString(metadata, "sourceURL"), readString(metadata, "url"), candidate.url());

        return new AcquiredSource(
                title,
                canonicalUrl,
                candidate.reliability(),
                candidate.sourceType(),
                "firecrawl",
                "just now",
                markdown,
                hash(markdown),
                score(candidate, markdown),
                summarize(markdown));
    }

    private AcquiredSource scrapeWithJsoup(SourceCandidate candidate) throws Exception {
        Document document = Jsoup.connect(candidate.url())
                .userAgent(USER_AGENT)
                .timeout(12000)
                .followRedirects(true)
                .get();

        document.select("script, style, noscript, svg, img, nav, footer").remove();
        String content = truncate(document.body() == null ? "" : document.body().text());
        String title = firstText(document.title(), candidate.title());

        return new AcquiredSource(
                title,
                document.location(),
                candidate.reliability(),
                candidate.sourceType(),
                "jsoup",
                "just now",
                content,
                hash(content),
                score(candidate, content),
                summarize(content));
    }

    private OfficialSourceSet officialSourceSet(String entity) {
        String normalized = entity.toLowerCase(Locale.ROOT);
        if (normalized.contains("supabase")) {
            return new OfficialSourceSet("https://supabase.com/pricing", "https://supabase.com/docs");
        }
        if (normalized.contains("firebase")) {
            return new OfficialSourceSet("https://firebase.google.com/pricing", "https://firebase.google.com/docs");
        }
        if (normalized.contains("cursor")) {
            return new OfficialSourceSet("https://cursor.com/pricing", "https://docs.cursor.com");
        }
        if (normalized.contains("windsurf")) {
            return new OfficialSourceSet("https://windsurf.com/pricing", "https://docs.windsurf.com");
        }
        if (normalized.contains("vercel")) {
            return new OfficialSourceSet("https://vercel.com/pricing", "https://vercel.com/docs");
        }
        if (normalized.contains("render")) {
            return new OfficialSourceSet("https://render.com/pricing", "https://render.com/docs");
        }
        if (normalized.contains("paddle")) {
            return new OfficialSourceSet("https://www.paddle.com/pricing", "https://developer.paddle.com");
        }
        if (normalized.contains("revenuecat")) {
            return new OfficialSourceSet("https://www.revenuecat.com/pricing", "https://www.revenuecat.com/docs");
        }
        if (normalized.contains("chatgpt") || normalized.contains("openai")) {
            return new OfficialSourceSet("https://openai.com/chatgpt/pricing", "https://help.openai.com");
        }
        if (normalized.contains("claude") || normalized.contains("anthropic")) {
            return new OfficialSourceSet("https://www.anthropic.com/pricing", "https://docs.anthropic.com");
        }

        return null;
    }

    private boolean isFirecrawlConfigured() {
        return StringUtils.hasText(firecrawlApiKey) && StringUtils.hasText(firecrawlApiUrl);
    }

    private double score(SourceCandidate candidate, String content) {
        double score = candidate.directUrl() ? 0.74 : 0.48;
        if ("Official".equals(candidate.reliability())) {
            score += 0.08;
        }
        if (StringUtils.hasText(content)) {
            score += Math.min(0.14, content.length() / 60_000.0);
        }
        return Math.min(0.94, score);
    }

    private String summarize(String content) {
        if (!StringUtils.hasText(content)) {
            return "No clean content extracted yet.";
        }

        String normalized = content.replaceAll("\\s+", " ").trim();
        return truncate(normalized, 320);
    }

    private String truncate(String value) {
        return truncate(value, MAX_CONTENT_CHARS);
    }

    private String truncate(String value, int maxChars) {
        if (value == null) {
            return "";
        }

        String trimmed = value.trim();
        return trimmed.length() <= maxChars ? trimmed : trimmed.substring(0, maxChars);
    }

    private String encode(String value) {
        return value.trim().replace(" ", "%20");
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }

        return "";
    }

    private String hash(String value) {
        return Integer.toHexString(Objects.toString(value, "").hashCode());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readMap(Map<String, Object> source, String key) {
        if (source == null) {
            return Map.of();
        }

        Object value = source.get(key);
        return value instanceof Map<?, ?> mapValue ? (Map<String, Object>) mapValue : Map.of();
    }

    private String readString(Map<String, Object> source, String key) {
        if (source == null) {
            return "";
        }

        Object value = source.get(key);
        return value instanceof String stringValue ? stringValue : "";
    }

    private record SourceCandidate(
            String title,
            String url,
            String reliability,
            String sourceType,
            boolean directUrl) {
    }

    private record OfficialSourceSet(String pricingUrl, String docsUrl) {
    }

    public record AcquiredSource(
            String title,
            String url,
            String reliability,
            String sourceType,
            String extractionMethod,
            String fetchedAt,
            String content,
            String contentHash,
            double confidence,
            String summary) {
    }
}
