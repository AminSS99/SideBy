package com.comparison.app.controller;

import com.comparison.app.service.AISummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/compare")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ComparisonController {

    private final AISummaryService aiSummaryService;

    /**
     * Compare two items side-by-side using AI
     * Example: /api/compare?itemA=Paris&itemB=London
     */
    @GetMapping
    public Map<String, Object> compare(
            @RequestParam String itemA,
            @RequestParam String itemB) {

        Map<String, Object> response = new HashMap<>();
        response.put("itemA", itemA);
        response.put("itemB", itemB);

        // AI-powered comparison of both items
        String summary = aiSummaryService.compareTwoItems(itemA, itemB);
        response.put("summary", summary);

        return response;
    }

    /**
     * Legacy single-item search (backward compatibility)
     */
    @GetMapping("/search")
    public Map<String, Object> searchSingle(@RequestParam String query) {
        Map<String, Object> response = new HashMap<>();
        response.put("query", query);
        response.put("summary", aiSummaryService.analyzeSingle(query));
        return response;
    }
}
