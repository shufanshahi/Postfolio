package com.example.postfolio.post.service;

import com.example.postfolio.post.models.PostType;
import com.google.gson.*;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
public class GeminiService {
    private final RestTemplate restTemplate;


    private String apiKey="AIzaSyDyu3V1zVQxZYZb-MMnP0UJMIT2WXRI-KY";

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    public GeminiResponse analyzePost(String content) {
        try {
            String sanitizedContent = content.replace("\"", "\\\"");
            String prompt = buildPrompt(sanitizedContent);
            String jsonResponse = callGeminiAPI(prompt);
            return parseResponse(jsonResponse);
        } catch (Exception e) {
            throw new RuntimeException("Failed to analyze post with Gemini: " + e.getMessage());
        }
    }

    private String buildPrompt(String content) {
        return """
            Analyze this post and return JSON with:
            1. "type" (ONLY: EXPERIENCE, EDUCATION, SKILL, PROJECT, ACHIEVEMENT)
            2. "tags" (comma-separated technical skills)
            
            Example response:
            {
              "type": "PROJECT",
              "tags": "React,Node.js"
            }
            
            Post: "%s"
            """.formatted(content);
    }

    private String callGeminiAPI(String prompt) throws JsonSyntaxException {
        try {
            // Build JSON payload properly using Gson
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

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-goog-api-key", apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> request = new HttpEntity<>(
                    new Gson().toJson(requestBody),
                    headers
            );

            ResponseEntity<String> response = restTemplate.postForEntity(
                    GEMINI_API_URL,
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
            JsonObject response = JsonParser.parseString(jsonResponse).getAsJsonObject();
            JsonObject candidate = response.getAsJsonArray("candidates")
                    .get(0).getAsJsonObject();
            String text = candidate.getAsJsonObject("content")
                    .getAsJsonArray("parts")
                    .get(0).getAsJsonObject()
                    .get("text").getAsString();

            JsonObject result = JsonParser.parseString(text).getAsJsonObject();

            // Validate response structure
            if (!result.has("type") || !result.has("tags")) {
                throw new RuntimeException("Invalid Gemini response format");
            }

            PostType type = PostType.valueOf(result.get("type").getAsString());
            String[] tags = result.get("tags").getAsString().split(",\\s*");

            return new GeminiResponse(
                    type,
                    Arrays.asList(tags)
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini response: " + e.getMessage());
        }
    }

    @RequiredArgsConstructor
    @Getter
    public static class GeminiResponse {
        private final PostType postType;
        private final List<String> tags;
    }
}