package com.comparison.app.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.cors.allowed-origins=http://test1.com,http://test2.com")
@AutoConfigureMockMvc
public class CorsTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testCorsAllowedOrigin() throws Exception {
        mockMvc.perform(options("/api/compare")
                .header("Origin", "http://test1.com")
                .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://test1.com"));
    }

    @Test
    public void testCorsRejectedOrigin() throws Exception {
        mockMvc.perform(options("/api/compare")
                .header("Origin", "http://unauthorized.com")
                .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}
