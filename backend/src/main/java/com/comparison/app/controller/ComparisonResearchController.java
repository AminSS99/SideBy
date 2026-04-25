package com.comparison.app.controller;

import com.comparison.app.service.ComparisonResearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comparisons")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174", "http://localhost:3000",
        "http://127.0.0.1:5173", "http://127.0.0.1:5174", "https://snapsolve.ink" })
public class ComparisonResearchController {

    private final ComparisonResearchService comparisonResearchService;

    public ComparisonResearchController(ComparisonResearchService comparisonResearchService) {
        this.comparisonResearchService = comparisonResearchService;
    }

    @PostMapping("/create")
    public ResponseEntity<ComparisonResearchService.ComparisonJob> create(@RequestBody CreateComparisonPayload payload) {
        return ResponseEntity.ok(comparisonResearchService.create(payload.query()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComparisonResearchService.ComparisonJob> get(@PathVariable String id) {
        return ResponseEntity.ok(comparisonResearchService.get(id));
    }

    @PostMapping("/{id}/refresh")
    public ResponseEntity<ComparisonResearchService.ComparisonJob> refresh(@PathVariable String id) {
        return ResponseEntity.ok(comparisonResearchService.refresh(id));
    }

    @PostMapping("/{id}/follow-up")
    public ResponseEntity<ComparisonResearchService.FollowUpAnswer> followUp(
            @PathVariable String id,
            @RequestBody FollowUpPayload payload) {
        return ResponseEntity.ok(comparisonResearchService.answerFollowUp(id, payload.question()));
    }

    @GetMapping("/steps")
    public ResponseEntity<Object> steps() {
        return ResponseEntity.ok(comparisonResearchService.steps());
    }

    private record CreateComparisonPayload(String query) {
    }

    private record FollowUpPayload(String question) {
    }
}
