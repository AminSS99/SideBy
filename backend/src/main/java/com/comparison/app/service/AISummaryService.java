package com.comparison.app.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AISummaryService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${deepseek.api.key}")
    private String deepseekApiKey;

    private static final String DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

    private final RestClient restClient;

    // Category keywords for detection
    private static final Set<String> SPORTS_KEYWORDS = Set.of(
            "bayern", "munich", "psg", "barcelona", "real madrid", "manchester", "liverpool",
            "chelsea", "arsenal", "juventus", "inter", "milan", "dortmund", "atletico",
            "nba", "lakers", "celtics", "warriors", "bulls", "heat", "knicks",
            "nfl", "patriots", "cowboys", "packers", "chiefs", "eagles",
            "team", "club", "fc", "united", "city", "athletic", "sporting", "football");

    private static final Set<String> TRAVEL_KEYWORDS = Set.of(
            "paris", "london", "tokyo", "new york", "rome", "amsterdam", "berlin",
            "dubai", "singapore", "bangkok", "sydney", "los angeles", "istanbul",
            "prague", "vienna", "budapest", "lisbon", "moscow", "beijing", "vacation");

    private static final Set<String> GAMING_KEYWORDS = Set.of(
            "ps5", "playstation", "xbox", "nintendo", "switch", "fortnite", "minecraft",
            "gta", "call of duty", "cod", "fifa", "nba2k", "zelda", "mario", "halo",
            "god of war", "spider-man", "elden ring", "game", "gaming", "console");

    private static final Set<String> AUTO_KEYWORDS = Set.of(
            "tesla", "bmw", "mercedes", "audi", "porsche", "toyota", "honda", "ford",
            "chevrolet", "volkswagen", "hyundai", "kia", "nissan", "mazda",
            "car", "vehicle", "suv", "sedan", "truck", "electric", "hybrid");

    private static final Set<String> FOOD_KEYWORDS = Set.of(
            "pizza", "burger", "sushi", "pasta", "tacos", "ramen", "steak", "salad",
            "sandwich", "wings", "fries", "noodles", "curry", "kebab", "shawarma",
            "mcdonald", "burger king", "kfc", "pizza hut", "domino", "subway",
            "starbucks", "chipotle", "taco bell", "wendy", "restaurant", "food", "cuisine");

    public AISummaryService() {
        this.restClient = RestClient.create();
    }

    /**
     * Compare two items side-by-side with smart category detection
     */
    public String compareTwoItems(String itemA, String itemB) {
        String category = detectCategory(itemA, itemB);
        String prompt = buildCategorySpecificPrompt(itemA, itemB, category);

        try {
            System.out.println("Trying Gemini API... Category: " + category);
            return callGeminiAPI(prompt);
        } catch (Exception e) {
            System.err.println("Gemini API error: " + e.getMessage());
            try {
                System.out.println("Falling back to DeepSeek API...");
                return callDeepSeekAPI(prompt);
            } catch (Exception e2) {
                System.err.println("DeepSeek API error: " + e2.getMessage());
                return generateFallbackComparison(itemA, itemB, category);
            }
        }
    }

    /**
     * Detect category based on keywords
     */
    private String detectCategory(String itemA, String itemB) {
        String combined = (itemA + " " + itemB).toLowerCase();

        if (FOOD_KEYWORDS.stream().anyMatch(combined::contains))
            return "food";
        if (SPORTS_KEYWORDS.stream().anyMatch(combined::contains))
            return "sports";
        if (TRAVEL_KEYWORDS.stream().anyMatch(combined::contains))
            return "travel";
        if (GAMING_KEYWORDS.stream().anyMatch(combined::contains))
            return "gaming";
        if (AUTO_KEYWORDS.stream().anyMatch(combined::contains))
            return "auto";

        return "tech"; // Default
    }

    /**
     * Build category-specific comparison prompt
     */
    private String buildCategorySpecificPrompt(String itemA, String itemB, String category) {
        String metricsSection = getCategoryMetrics(category);
        String tipsSection = getCategoryTips(category);

        return """
                You are an expert %s comparison analyst. Compare "%s" vs "%s".

                ## Category: %s

                IMPORTANT: Use ONLY these domain-specific metrics for comparison:
                %s

                ## 🏆 Quick Verdict
                [One clear sentence declaring the winner and why. Name the winner explicitly.]

                ## %s
                - Strength 1: [specific to this %s context]
                - Strength 2: [specific to this %s context]
                - Strength 3: [specific to this %s context]
                - Best for: [target audience for %s]

                ## %s
                - Strength 1: [specific to this %s context]
                - Strength 2: [specific to this %s context]
                - Strength 3: [specific to this %s context]
                - Best for: [target audience for %s]

                ## 📊 Head-to-Head Scores (rate 1-100)
                | Metric | %s | %s | Winner |
                |--------|------|------|--------|
                %s

                ## 💡 Contextual Tip
                %s

                ## 📝 Final Recommendation
                Choose %s if [specific condition]. Choose %s if [specific condition].

                Keep response under 400 words. Be specific, practical, and domain-appropriate. Always declare a clear winner.
                """
                .formatted(
                        category, itemA, itemB,
                        category.toUpperCase(),
                        metricsSection,
                        itemA, category, category, category, category,
                        itemB, category, category, category, category,
                        itemA, itemB,
                        getMetricsTableRows(category),
                        tipsSection,
                        itemA, itemB);
    }

    /**
     * Get category-specific metrics
     */
    private String getCategoryMetrics(String category) {
        return switch (category) {
            case "sports" -> """
                    - Trophies Won (total major titles and recent success)
                    - Squad Value (market value of players)
                    - Fan Base (global supporters and stadium atmosphere)
                    - History & Legacy (tradition, founding, legends)
                    - Youth Academy (player development quality)
                    - Manager Quality (tactical ability, experience)
                    - Recent Form (last season performance)
                    - European Success (Champions League/Europa performance)
                    - Domestic Dominance (league titles, consistency)
                    - Star Players (key talent and marquee names)
                    - Financial Power (revenue, spending ability)
                    - Stadium (capacity, atmosphere, facilities)
                    """;
            case "travel" -> """
                    - Cost of Living (daily expenses, accommodation, food)
                    - Safety (crime rate, tourist safety)
                    - Weather (climate, best seasons to visit)
                    - Culture (museums, history, art scene)
                    - Food Scene (cuisine variety, restaurants)
                    - Nightlife (bars, clubs, entertainment)
                    - Public Transport (metro, buses, walkability)
                    - Tourist Attractions (landmarks, must-see spots)
                    - Language (English friendliness)
                    - Accommodation (hotel quality, Airbnb options)
                    - Shopping (markets, stores, souvenirs)
                    - Local Experience (authenticity, local immersion)
                    """;
            case "gaming" -> """
                    - Graphics (visual quality, art style)
                    - Gameplay (fun factor, mechanics)
                    - Story (narrative, characters)
                    - Multiplayer (online experience, modes)
                    - Exclusives (unique titles, franchises)
                    - Price (value for money)
                    - Player Base (active community)
                    - Updates (content support, DLC)
                    - Controls (responsiveness, layout)
                    - Replay Value (longevity)
                    - Esports Scene (competitive potential)
                    - Hardware (specs, performance)
                    """;
            case "auto" -> """
                    - Performance (horsepower, acceleration, top speed)
                    - Fuel Economy (MPG or electric range)
                    - Safety (crash ratings, ADAS features)
                    - Comfort (ride quality, noise, seats)
                    - Price (MSRP, value proposition)
                    - Reliability (dependability, maintenance)
                    - Resale Value (depreciation rate)
                    - Features (tech, infotainment, connectivity)
                    - Interior Quality (materials, design)
                    - Cargo Space (trunk, practicality)
                    - Handling (driving dynamics, steering)
                    - Brand Prestige (reputation, status)
                    """;
            case "food" -> """
                    - Taste (flavor, freshness, quality)
                    - Price (cost per serving, value)
                    - Portion Size (amount of food)
                    - Ingredients (quality, freshness)
                    - Preparation Time (how long to make/serve)
                    - Nutritional Value (calories, health factor)
                    - Availability (ease of finding)
                    - Variety (menu options, customization)
                    - Popularity (how widely loved)
                    - Convenience (ease of eating)
                    - Ambiance (dining experience)
                    - Satisfaction (overall fulfillment)
                    """;
            default -> """
                    - Performance (speed, efficiency)
                    - Ease of Use (learning curve)
                    - Community (support, ecosystem)
                    - Documentation (guides, tutorials)
                    - Features (functionality, capabilities)
                    - Price/Value (cost effectiveness)
                    - Scalability (growth potential)
                    - Reliability (stability, uptime)
                    - Integration (compatibility)
                    - Future Outlook (roadmap, updates)
                    """;
        };
    }

    /**
     * Get contextual tips for category
     */
    private String getCategoryTips(String category) {
        return switch (category) {
            case "sports" -> "Consider recent Champions League and domestic league performance when choosing";
            case "travel" -> "Book accommodations 3 months in advance and visit attractions early morning";
            case "gaming" -> "Check if your friends play on the same platform before deciding";
            case "auto" -> "Always test drive both vehicles and consider total cost of ownership";
            case "food" -> "Consider taste preferences, dietary needs, and value for money when choosing";
            default -> "Check community activity and long-term support before committing";
        };
    }

    /**
     * Get metrics table rows for category
     */
    private String getMetricsTableRows(String category) {
        return switch (category) {
            case "sports" -> """
                    | Trophies | [score] | [score] | [winner] |
                    | Squad Value | [score] | [score] | [winner] |
                    | Fan Base | [score] | [score] | [winner] |
                    | Recent Form | [score] | [score] | [winner] |
                    | European Success | [score] | [score] | [winner] |
                    | Youth Academy | [score] | [score] | [winner] |
                    """;
            case "travel" -> """
                    | Cost of Living | [score] | [score] | [winner] |
                    | Safety | [score] | [score] | [winner] |
                    | Culture | [score] | [score] | [winner] |
                    | Food Scene | [score] | [score] | [winner] |
                    | Public Transport | [score] | [score] | [winner] |
                    | Nightlife | [score] | [score] | [winner] |
                    """;
            case "gaming" -> """
                    | Graphics | [score] | [score] | [winner] |
                    | Gameplay | [score] | [score] | [winner] |
                    | Exclusives | [score] | [score] | [winner] |
                    | Multiplayer | [score] | [score] | [winner] |
                    | Value | [score] | [score] | [winner] |
                    | Player Base | [score] | [score] | [winner] |
                    """;
            case "auto" -> """
                    | Performance | [score] | [score] | [winner] |
                    | Fuel Economy | [score] | [score] | [winner] |
                    | Safety | [score] | [score] | [winner] |
                    | Comfort | [score] | [score] | [winner] |
                    | Reliability | [score] | [score] | [winner] |
                    | Value | [score] | [score] | [winner] |
                    """;
            case "food" -> """
                    | Taste | [score] | [score] | [winner] |
                    | Price | [score] | [score] | [winner] |
                    | Portion Size | [score] | [score] | [winner] |
                    | Convenience | [score] | [score] | [winner] |
                    | Nutrition | [score] | [score] | [winner] |
                    | Satisfaction | [score] | [score] | [winner] |
                    """;
            default -> """
                    | Performance | [score] | [score] | [winner] |
                    | Ease of Use | [score] | [score] | [winner] |
                    | Community | [score] | [score] | [winner] |
                    | Features | [score] | [score] | [winner] |
                    | Value | [score] | [score] | [winner] |
                    | Future Outlook | [score] | [score] | [winner] |
                    """;
        };
    }

    /**
     * Analyze a single item
     */
    public String analyzeSingle(String query) {
        String prompt = buildSingleAnalysisPrompt(query);
        try {
            return callGeminiAPI(prompt);
        } catch (Exception e) {
            try {
                return callDeepSeekAPI(prompt);
            } catch (Exception e2) {
                return "Unable to analyze '" + query + "'. Please try again later.";
            }
        }
    }

    private String buildSingleAnalysisPrompt(String query) {
        return """
                You are an expert analyst. Analyze "%s".
                Provide:
                1. Quick overview (1-2 sentences)
                2. Key strengths (3 bullet points)
                3. Potential drawbacks (2 bullet points)
                4. Best for: [target audience]
                5. Pro tip for getting the most value
                Keep response under 150 words.
                """.formatted(query);
    }

    private String callGeminiAPI(String prompt) {
        String fullUrl = geminiApiUrl + "?key=" + geminiApiKey;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("temperature", 0.7, "maxOutputTokens", 1200));

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
                        System.out.println("✅ Gemini API success");
                        return (String) parts.get(0).get("text");
                    }
                }
            }
        }
        throw new RuntimeException("Invalid response from Gemini API");
    }

    private String callDeepSeekAPI(String prompt) {
        Map<String, Object> requestBody = Map.of(
                "model", "deepseek-chat",
                "messages", List.of(
                        Map.of("role", "system", "content", "You are a helpful comparison expert."),
                        Map.of("role", "user", "content", prompt)),
                "temperature", 0.7,
                "max_tokens", 1200);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri(DEEPSEEK_API_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + deepseekApiKey)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response != null && response.containsKey("choices")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (!choices.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                if (message != null && message.containsKey("content")) {
                    System.out.println("✅ DeepSeek API success (fallback)");
                    return (String) message.get("content");
                }
            }
        }
        throw new RuntimeException("Invalid response from DeepSeek API");
    }

    private String generateFallbackComparison(String itemA, String itemB, String category) {
        String categoryLabel = category.toUpperCase();
        return """
                ## Category: %s

                ## 🏆 Quick Verdict
                Both %s and %s are excellent choices in the %s category - the winner depends on your specific needs.

                ## %s
                - Strength 1: Strong reputation and proven track record
                - Strength 2: Wide community support
                - Strength 3: Consistent performance
                - Best for: Those who value reliability

                ## %s
                - Strength 1: Modern approach and innovation
                - Strength 2: Growing popularity
                - Strength 3: Fresh perspective
                - Best for: Those seeking something new

                ## 📊 Head-to-Head
                | Metric | %s | %s |
                |--------|------|------|
                | Overall | 85 | 82 |
                | Value | 80 | 85 |
                | Popularity | 88 | 78 |

                ## 💡 Final Recommendation
                Choose %s for stability. Choose %s for innovation.

                ⚠️ AI service temporarily unavailable. Try again for detailed analysis.
                """.formatted(categoryLabel, itemA, itemB, category, itemA, itemB, itemA, itemB, itemA, itemB);
    }
}
