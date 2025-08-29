package com.example.aiservice.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class GeminiClient {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @CircuitBreaker(name = "gemini-api", fallbackMethod = "fallbackGenerateContent")
    public String generateContent(String prompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = Map.of(
                    "contents", new Map[] {
                            Map.of(
                                    "parts", new Map[] {
                                            Map.of("text", prompt)
                                    })
                    });

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            String url = apiUrl + "?key=" + apiKey;

            log.debug("Making Gemini API request to: {}", url);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return extractContentFromResponse(response.getBody());
            } else {
                log.error("Gemini API request failed with status: {}", response.getStatusCode());
                throw new RuntimeException("Gemini API request failed");
            }
        } catch (Exception e) {
            log.error("Error calling Gemini API", e);
            throw new RuntimeException("Gemini API call failed: " + e.getMessage(), e);
        }
    }

    public String fallbackGenerateContent(String prompt, Exception ex) {
        log.warn("Gemini API fallback triggered for prompt: {}. Error: {}", prompt, ex.getMessage());
        return "{\"error\": \"AI service temporarily unavailable\", \"fallback\": true}";
    }

    private String extractContentFromResponse(String responseBody) {
        try {
            JsonNode rootNode = objectMapper.readTree(responseBody);
            JsonNode candidatesNode = rootNode.path("candidates");

            if (candidatesNode.isArray() && candidatesNode.size() > 0) {
                JsonNode firstCandidate = candidatesNode.get(0);
                JsonNode contentNode = firstCandidate.path("content");
                JsonNode partsNode = contentNode.path("parts");

                if (partsNode.isArray() && partsNode.size() > 0) {
                    JsonNode firstPart = partsNode.get(0);
                    JsonNode textNode = firstPart.path("text");

                    if (!textNode.isMissingNode()) {
                        return textNode.asText();
                    }
                }
            }

            log.error("Could not extract content from Gemini response: {}", responseBody);
            return responseBody; // Return raw response if extraction fails
        } catch (Exception e) {
            log.error("Error parsing Gemini response", e);
            return responseBody; // Return raw response if parsing fails
        }
    }
}
