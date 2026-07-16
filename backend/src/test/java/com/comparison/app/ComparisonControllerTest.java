package com.comparison.app;

import com.comparison.app.controller.ComparisonController;
import com.comparison.app.service.AIResponse;
import com.comparison.app.service.AISummaryService;
import com.comparison.app.service.CompareRequestOptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ComparisonControllerTest {

    @Mock
    private AISummaryService aiSummaryService;

    @InjectMocks
    private ComparisonController comparisonController;

    @BeforeEach
    void setUp() {
        AIResponse mockResponse = new AIResponse("Mock summary", "openai", "gpt-4o", "tech", false, 100, 50, 150);
        when(aiSummaryService.compareTwoItems(any(String.class), any(String.class), any(CompareRequestOptions.class)))
                .thenReturn(mockResponse);
    }

    @Test
    void testSanitization() {
        ResponseEntity<Map<String, Object>> response = comparisonController.compare(
                "itemA <script>alert(1)</script>",
                "itemB & \"onmouseover=alert(1)\"",
                "127.0.0.1",
                null
        );

        assertEquals(200, response.getStatusCode().value());
        Map<String, Object> body = response.getBody();
        assertEquals("itemA &lt;script&gt;alert(1)&lt;/script&gt;", body.get("itemA"));
        assertEquals("itemB &amp; &quot;onmouseover=alert(1)&quot;", body.get("itemB"));
    }
}
