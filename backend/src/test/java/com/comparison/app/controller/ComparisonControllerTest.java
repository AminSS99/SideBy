package com.comparison.app.controller;

import com.comparison.app.service.AISummaryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ComparisonControllerTest {

    private ComparisonController comparisonController;
    private AISummaryService aiSummaryService;

    @BeforeEach
    void setUp() {
        aiSummaryService = mock(AISummaryService.class);
        comparisonController = new ComparisonController(aiSummaryService);
    }

    @Test
    void searchSingle_SanitizesHtmlEntities() {
        String xssPayload = "<script>alert('xss')</script> & \"test\"";

        // Mock the service
        when(aiSummaryService.analyzeSingle(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn("Mocked summary");

        ResponseEntity<Map<String, Object>> response = comparisonController.searchSingle(xssPayload, "192.168.1.1", null);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());

        String sanitizedQuery = (String) response.getBody().get("query");
        assertEquals("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt; &amp; &quot;test&quot;", sanitizedQuery);
    }
}
