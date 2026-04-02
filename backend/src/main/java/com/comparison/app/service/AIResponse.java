package com.comparison.app.service;

public record AIResponse(
        String summary,
        String provider,
        String model,
        String category,
        boolean fallback,
        Integer inputTokens,
        Integer outputTokens,
        Integer totalTokens) {
}
