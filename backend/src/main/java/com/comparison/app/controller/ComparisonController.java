package com.comparison.app.controller;

import com.comparison.app.service.AISummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/compare")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:3000", "https://sideby.app" })
public class ComparisonController {

    private final AISummaryService aiSummaryService;

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
            @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
            @RequestHeader(value = "X-Real-IP", required = false) String realIp) {

        Map<String, Object> response = new HashMap<>();

        // Get client IP for rate limiting
        String clientIp = getClientIp(forwardedFor, realIp);

        // Check rate limit
        if (!checkRateLimit(clientIp)) {
            response.put("error", "Too many requests. Please wait a moment.");
            response.put("retryAfter", 60);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
        }

        // Validate and sanitize inputs
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

        // AI-powered comparison of both items
        String summary = aiSummaryService.compareTwoItems(sanitizedA, sanitizedB);
        response.put("summary", summary);

        return ResponseEntity.ok(response);
    }

    /**
     * Legacy single-item search (backward compatibility)
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchSingle(
            @RequestParam String query,
            @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
            @RequestHeader(value = "X-Real-IP", required = false) String realIp) {

        Map<String, Object> response = new HashMap<>();

        String clientIp = getClientIp(forwardedFor, realIp);
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

    /**
     * Get client IP address
     */
    private String getClientIp(String forwardedFor, String realIp) {
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            return forwardedFor.split(",")[0].trim();
        }
        if (realIp != null && !realIp.isEmpty()) {
            return realIp;
        }
        return "unknown";
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
}
