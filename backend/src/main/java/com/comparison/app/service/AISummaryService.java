package com.comparison.app.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;

@Service
public class AISummaryService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestClient restClient;

    public AISummaryService() {
        this.restClient = RestClient.create();
    }

    /**
     * Compare two items side-by-side with smart category detection
     */
    public String compareTwoItems(String itemA, String itemB) {
        String prompt = buildComparisonPrompt(itemA, itemB);

        try {
            return callGeminiAPI(prompt);
        } catch (Exception e) {
            System.err.println("Gemini API error: " + e.getMessage());
            return generateFallbackComparison(itemA, itemB);
        }
    }

    /**
     * Analyze a single item
     */
    public String analyzeSingle(String query) {
        String prompt = buildSingleAnalysisPrompt(query);

        try {
            return callGeminiAPI(prompt);
        } catch (Exception e) {
            System.err.println("Gemini API error: " + e.getMessage());
            return "Unable to analyze '" + query + "'. Please try again later.";
        }
    }

    private String buildComparisonPrompt(String itemA, String itemB) {
        return """
                You are an expert comparison AI. Compare "%s" vs "%s".

                FIRST: Detect what category this comparison belongs to:
                - Travel/Cities (e.g., Paris vs London)
                - Technology (e.g., React vs Vue, iPhone vs Samsung)
                - Gaming (e.g., PS5 vs Xbox, Fortnite vs Apex)
                - Services (e.g., Vercel vs Netlify, Spotify vs Apple Music)
                - Food/Restaurants
                - Products/Shopping
                - Other

                THEN: Provide a structured side-by-side comparison:

                ## 🏆 Quick Verdict
                One sentence declaring which is better and why.

                ## %s
                • Key strengths (2-3 bullet points)
                • Best for: [target audience]

                ## %s
                • Key strengths (2-3 bullet points)
                • Best for: [target audience]

                ## 📊 Head-to-Head
                | Aspect | %s | %s |
                |--------|-------|-------|
                | [Key factor 1] | Rating/info | Rating/info |
                | [Key factor 2] | Rating/info | Rating/info |
                | [Key factor 3] | Rating/info | Rating/info |

                ## 💡 Final Recommendation
                Who should choose which, and why.

                Keep response under 300 words. Be specific, practical, and helpful.
                """.formatted(itemA, itemB, itemA, itemB, itemA, itemB);
    }

    private String buildSingleAnalysisPrompt(String query) {
        return """
                You are an expert analyst. Analyze "%s".

                FIRST: Detect what category this belongs to and adjust your analysis accordingly.

                Provide:
                1. Quick overview (1-2 sentences)
                2. Key strengths (3 bullet points)
                3. Potential drawbacks (2 bullet points)
                4. Best for: [target audience]
                5. Pro tip for getting the most value

                Keep response under 150 words. Be specific and actionable.
                """.formatted(query);
    }

    private String callGeminiAPI(String prompt) {
        String fullUrl = apiUrl + "?key=" + apiKey;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "temperature", 0.7,
                        "maxOutputTokens", 800));

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri(fullUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response != null && response.containsKey("candidates")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (!candidates.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                if (content != null && content.containsKey("parts")) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (!parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
        }

        throw new RuntimeException("Invalid response from Gemini API");
    }

    private String generateFallbackComparison(String itemA, String itemB) {
        return """
                ## %s vs %s

                Unable to fetch live AI analysis. Here's a basic comparison:

                **%s**: A popular choice with its own unique strengths.

                **%s**: Another solid option worth considering.

                💡 Tip: Try the comparison again for detailed AI-powered insights.
                """.formatted(itemA, itemB, itemA, itemB);
    }
}
