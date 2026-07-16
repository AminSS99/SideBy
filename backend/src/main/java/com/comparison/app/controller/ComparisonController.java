package com.comparison.app.controller;

import com.comparison.app.service.AIResponse;
import com.comparison.app.service.AISummaryService;
import com.comparison.app.service.CompareRequestOptions;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/compare")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174", "http://localhost:3000",
        "https://snapsolve.ink" })
public class ComparisonController {

    private final AISummaryService aiSummaryService;

    public ComparisonController(AISummaryService aiSummaryService) {
        this.aiSummaryService = aiSummaryService;
    }

    // Simple rate limiting: max 10 requests per minute per IP
    private final ConcurrentHashMap<String, RateLimitInfo> rateLimits = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final int MAX_INPUT_LENGTH = 100;

    /**
     * Compare two items side-by-side using AI
     * Example: /api/compare?itemA=Paris&itemB=London
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> compare(
            @RequestParam String itemA,
            @RequestParam String itemB,
            HttpServletRequest request) {

        return compareInternal(
                itemA,
                itemB,
                CompareRequestOptions.defaults(),
                request);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> compareAdvanced(
            @RequestBody CompareRequestPayload payload,
            HttpServletRequest request) {

        CompareRequestOptions options = new CompareRequestOptions(
                payload.category(),
                payload.compareMode(),
                payload.decisionContext(),
                safeList(payload.priorities()),
                safeList(payload.mustHaves()),
                safeList(payload.redFlags()),
                payload.depth());

        return compareInternal(payload.itemA(), payload.itemB(), options, request);
    }

    /**
     * Legacy single-item search (backward compatibility)
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchSingle(
            @RequestParam String query,
            HttpServletRequest request) {

        Map<String, Object> response = new HashMap<>();

        String clientIp = request.getRemoteAddr();
        if (!checkRateLimit(clientIp)) {
            response.put("error", "Too many requests. Please wait a moment.");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
        }

        String sanitizedQuery = sanitizeInput(query);
        if (sanitizedQuery.isEmpty()) {
            response.put("error", "Query is required");
            return ResponseEntity.badRequest().body(response);
        }

        response.put("query", sanitizedQuery);
        response.put("summary", aiSummaryService.analyzeSingle(sanitizedQuery));
        return ResponseEntity.ok(response);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("service", "SideBy API");
        return ResponseEntity.ok(response);
    }

    /**
     * Sanitize user input to prevent injection attacks
     */
    private String sanitizeInput(String input) {
        if (input == null)
            return "";

        return input
                .trim()
                .substring(0, Math.min(input.length(), MAX_INPUT_LENGTH))
                .replaceAll("[<>]", "") // Remove angle brackets
                .replaceAll("(?i)javascript:", "") // Remove javascript protocol
                .replaceAll("(?i)on\\w+=", "") // Remove event handlers
                .replaceAll("[\\x00-\\x1F]", ""); // Remove control characters
    }

    private ResponseEntity<Map<String, Object>> compareInternal(
            String itemA,
            String itemB,
            CompareRequestOptions options,
            HttpServletRequest request) {

        Map<String, Object> response = new HashMap<>();
        String clientIp = request.getRemoteAddr();

        if (!checkRateLimit(clientIp)) {
            response.put("error", "Too many requests. Please wait a moment.");
            response.put("retryAfter", 60);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
        }

        String sanitizedA = sanitizeInput(itemA);
        String sanitizedB = sanitizeInput(itemB);

        if (sanitizedA.isEmpty() || sanitizedB.isEmpty()) {
            response.put("error", "Both items are required");
            return ResponseEntity.badRequest().body(response);
        }

        if (sanitizedA.length() < 2 || sanitizedB.length() < 2) {
            response.put("error", "Items must be at least 2 characters");
            return ResponseEntity.badRequest().body(response);
        }

        if (sanitizedA.equalsIgnoreCase(sanitizedB)) {
            response.put("error", "Items must be different");
            return ResponseEntity.badRequest().body(response);
        }

        response.put("itemA", sanitizedA);
        response.put("itemB", sanitizedB);

        long startedAt = System.currentTimeMillis();
        AIResponse aiResponse = aiSummaryService.compareTwoItems(sanitizedA, sanitizedB, options);
        response.put("summary", aiResponse.summary());
        response.put("provider", aiResponse.provider());
        response.put("model", aiResponse.model());
        response.put("category", aiResponse.category());
        response.put("fallback", aiResponse.fallback());
        response.put("inputTokens", aiResponse.inputTokens());
        response.put("outputTokens", aiResponse.outputTokens());
        response.put("totalTokens", aiResponse.totalTokens());
        response.put("latencyMs", System.currentTimeMillis() - startedAt);

        return ResponseEntity.ok(response);
    }

    private List<String> safeList(List<String> values) {
        return values == null ? List.of() : values;
    }

    /**
     * Check and update rate limit for client
     */
    private boolean checkRateLimit(String clientIp) {
        long now = System.currentTimeMillis();

        rateLimits.compute(clientIp, (key, info) -> {
            if (info == null || now - info.windowStart > 60000) {
                // New window
                return new RateLimitInfo(now, 1);
            }
            info.count.incrementAndGet();
            return info;
        });

        RateLimitInfo info = rateLimits.get(clientIp);
        return info != null && info.count.get() <= MAX_REQUESTS_PER_MINUTE;
    }

    /**
     * Rate limit tracking info
     */
    private static class RateLimitInfo {
        long windowStart;
        AtomicInteger count;

        RateLimitInfo(long windowStart, int count) {
            this.windowStart = windowStart;
            this.count = new AtomicInteger(count);
        }
    }

    private record CompareRequestPayload(
            String itemA,
            String itemB,
            String category,
            String compareMode,
            String decisionContext,
            List<String> priorities,
            List<String> mustHaves,
            List<String> redFlags,
            String depth) {
    }
}
