package com.example.postfolio.post.service;

import com.example.postfolio.post.models.PostType;
import com.google.gson.*;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiService {
    private final RestTemplate restTemplate;

    private String apiKey = "AIzaSyDyu3V1zVQxZYZb-MMnP0UJMIT2WXRI-KY";

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    public GeminiResponse analyzePost(String content) {
        try {
            String sanitizedContent = content.replace("\"", "\\\"");
            String prompt = buildPrompt(sanitizedContent);
            String jsonResponse = callGeminiAPI(prompt);
            log.debug("Gemini API raw response: {}", jsonResponse);
            return parseResponse(jsonResponse);
        } catch (Exception e) {
            log.error("Gemini analysis failed for content: {}", content, e);
            throw new RuntimeException("Failed to analyze post with Gemini: " + e.getMessage());
        }
    }

    private String buildPrompt(String content) {
        return """
            Analyze this post and return STRICT JSON format with:
            1. "type" (ONLY choose one: EXPERIENCE, EDUCATION, SKILL, PROJECT, ACHIEVEMENT) Acadamic achievements goes to EDUCATION other achievement goes to ACHIEVEMENT
            2. "tags" (comma-separated any skills such as debating,technical skill,language any soft skills)
            
            Return ONLY the JSON object, without any markdown formatting or additional text.
            Example response:
            {
              "type": "PROJECT",
              "tags": "React,Node.js"
            }
            
            Post Content: "%s"
            """.formatted(content);
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

            // Add generation config to encourage clean JSON output
            JsonObject generationConfig = new JsonObject();
            generationConfig.addProperty("temperature", 0.7);
            requestBody.add("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-goog-api-key", apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> request = new HttpEntity<>(
                    new Gson().toJson(requestBody),
                    headers
            );

            ResponseEntity<String> response = restTemplate.postForEntity(
                    GEMINI_API_URL + "?key=" + apiKey, // Adding API key as query parameter as fallback
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

    private GeminiResponse parseResponse(String jsonResponse) {
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

            // Extract JSON from text (handles both raw JSON and markdown-wrapped JSON)
            String jsonContent = extractJsonFromText(text);

            JsonObject result = JsonParser.parseString(jsonContent).getAsJsonObject();

            // Validate response structure
            if (!result.has("type") || !result.has("tags")) {
                throw new RuntimeException("Invalid Gemini response format - missing required fields");
            }

            PostType type;
            try {
                type = PostType.valueOf(result.get("type").getAsString());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid post type received, defaulting to SKILL");
                type = PostType.SKILL;
            }

            String tagsString = result.get("tags").getAsString();
            List<String> tags = Arrays.stream(tagsString.split(",\\s*"))
                    .filter(tag -> !tag.isBlank())
                    .toList();

            if (tags.isEmpty()) {
                tags = List.of("General");
            }

            return new GeminiResponse(type, tags);
        } catch (JsonSyntaxException e) {
            log.error("Invalid JSON response from Gemini: {}", jsonResponse);
            throw new RuntimeException("Malformed JSON response from Gemini");
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini response: " + e.getMessage());
        }
    }

    private String extractJsonFromText(String text) {
        // If the response is wrapped in markdown code blocks
        if (text.trim().startsWith("```json")) {
            int start = text.indexOf("{");
            int end = text.lastIndexOf("}");
            if (start >= 0 && end > start) {
                return text.substring(start, end + 1);
            }
        }
        // If the response is just the JSON
        else if (text.trim().startsWith("{")) {
            return text;
        }
        throw new RuntimeException("Could not extract JSON from Gemini response: " + text);
    }

    @Getter
    @RequiredArgsConstructor
    public static class GeminiResponse {
        private final PostType postType;
        private final List<String> tags;
    }
}