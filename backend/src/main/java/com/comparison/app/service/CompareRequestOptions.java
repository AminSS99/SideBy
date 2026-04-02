package com.comparison.app.service;

import java.util.List;

public record CompareRequestOptions(
        String categoryOverride,
        String compareMode,
        String decisionContext,
        List<String> priorities,
        List<String> mustHaves,
        List<String> redFlags,
        String depth) {

    public static CompareRequestOptions defaults() {
        return new CompareRequestOptions(
                null,
                "balanced",
                null,
                List.of(),
                List.of(),
                List.of(),
                "standard");
    }
}
