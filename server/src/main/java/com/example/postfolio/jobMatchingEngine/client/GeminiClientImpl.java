package com.example.postfolio.jobMatchingEngine.client;

import com.google.gson.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;



@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiClientImpl implements GeminiClient {

    private final RestTemplate restTemplate;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent}")
    private String geminiApiUrl;

    @Override
    public String generateContent(String prompt) {
        try {
            String jsonResponse = callGeminiAPI(prompt);
            log.debug("Gemini API raw response: {}", jsonResponse);
            return extractTextFromResponse(jsonResponse);
        } catch (Exception e) {
            log.error("Gemini API call failed for prompt length: {}", prompt.length(), e);
            throw new RuntimeException("Failed to call Gemini API: " + e.getMessage());
        }
    }

    private String callGeminiAPI(String prompt) {
        try {
            JsonObject requestBody = new JsonObject();
            JsonArray contents = new JsonArray();
            JsonObject content = new JsonObject();
            JsonArray parts = new JsonArray();
            JsonObject part = new JsonObject();

            part.addProperty("text", prompt);
            parts.add(part);
            content.add("parts", parts);
            contents.add(content);
            requestBody.add("contents", contents);

            // Add generation config for consistent JSON output
            JsonObject generationConfig = new JsonObject();
            generationConfig.addProperty("temperature", 0.1); // Low temperature for consistent scoring
            generationConfig.addProperty("maxOutputTokens", 1024);
            requestBody.add("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-goog-api-key", apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> request = new HttpEntity<>(
                    new Gson().toJson(requestBody),
                    headers
            );

            ResponseEntity<String> response = restTemplate.postForEntity(
                    geminiApiUrl + "?key=" + apiKey,
                    request,
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("API request failed with status: " + response.getStatusCode());
            }

            return response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("Gemini API call failed: " + e.getMessage());
        }
    }

    private String extractTextFromResponse(String jsonResponse) {
        try {
            JsonElement root = JsonParser.parseString(jsonResponse);
            JsonObject response = root.getAsJsonObject();

            if (!response.has("candidates") || response.getAsJsonArray("candidates").isEmpty()) {
                throw new RuntimeException("No candidates in Gemini response");
            }

            JsonObject candidate = response.getAsJsonArray("candidates")
                    .get(0).getAsJsonObject();
            String text = candidate.getAsJsonObject("content")
                    .getAsJsonArray("parts")
                    .get(0).getAsJsonObject()
                    .get("text").getAsString();

            return text;
        } catch (JsonSyntaxException e) {
            log.error("Invalid JSON response from Gemini: {}", jsonResponse);
            throw new RuntimeException("Malformed JSON response from Gemini");
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini response: " + e.getMessage());
        }
    }
}