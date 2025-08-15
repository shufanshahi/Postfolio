package com.example.postfolio.postservice.post.service;

import com.example.postfolio.postservice.post.dto.GeminiResponse;
import com.example.postfolio.postservice.post.models.PostType;
import com.google.gson.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

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
            // Fallback to mock analysis
            return getMockResponse(content);
        }
    }

    private String buildPrompt(String content) {
        return """
            Analyze this post and return STRICT JSON format with:
            1. "summary" (a concise 5-7 word summary suitable for a CV heading)
            2. "type" (ONLY choose one: EXPERIENCE, EDUCATION, SKILL, PROJECT, ACHIEVEMENT)
            3. "tags" (comma-separated any relevant skills/topics)
            
            Guidelines:
            - Summary should be professional and highlight key achievements
            - For experience: focus on role and impact
            - For projects: highlight technology and purpose
            - For education: include qualification and institution if mentioned
            - Keep summary under 10 words
            
            Return ONLY the JSON object, without any markdown formatting or additional text.
            Example response:
            {
              "summary": "Led React migration project",
              "type": "PROJECT",
              "tags": "React,Node.js,Team Leadership"
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

            JsonObject generationConfig = new JsonObject();
            generationConfig.addProperty("temperature", 0.3);
            generationConfig.addProperty("maxOutputTokens", 200);
            requestBody.add("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-goog-api-key", apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> request = new HttpEntity<>(
                    new Gson().toJson(requestBody),
                    headers
            );

            ResponseEntity<String> response = restTemplate.postForEntity(
                    GEMINI_API_URL + "?key=" + apiKey,
                    request,
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Gemini API returned status: " + response.getStatusCode());
            }

            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to call Gemini API", e);
            throw new RuntimeException("Failed to call Gemini API: " + e.getMessage());
        }
    }

    private GeminiResponse parseResponse(String jsonResponse) {
        try {
            JsonObject responseObj = JsonParser.parseString(jsonResponse).getAsJsonObject();
            JsonArray candidates = responseObj.getAsJsonArray("candidates");
            JsonObject candidate = candidates.get(0).getAsJsonObject();
            JsonObject content = candidate.getAsJsonObject("content");
            JsonArray parts = content.getAsJsonArray("parts");
            String text = parts.get(0).getAsJsonObject().get("text").getAsString();

            // Clean the response text
            text = text.trim();
            if (text.startsWith("```json")) {
                text = text.substring(7);
            }
            if (text.endsWith("```")) {
                text = text.substring(0, text.length() - 3);
            }
            text = text.trim();

            JsonObject analysis = JsonParser.parseString(text).getAsJsonObject();
            String summary = analysis.get("summary").getAsString();
            String typeStr = analysis.get("type").getAsString();
            String tagsStr = analysis.get("tags").getAsString();

            PostType type = PostType.valueOf(typeStr);
            List<String> tags = Arrays.asList(tagsStr.split(","));

            return new GeminiResponse(type, tags);
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", jsonResponse, e);
            throw new RuntimeException("Failed to parse Gemini response: " + e.getMessage());
        }
    }

    private GeminiResponse getMockResponse(String content) {
        String lowerContent = content.toLowerCase();
        PostType type;
        List<String> tags;

        if (lowerContent.contains("built") || lowerContent.contains("developed")) {
            type = PostType.PROJECT;
            tags = Arrays.asList("Project", "Development");
        } else if (lowerContent.contains("work") || lowerContent.contains("at")) {
            type = PostType.EXPERIENCE;
            tags = Arrays.asList("Experience", "Work");
        } else if (lowerContent.contains("learn") || lowerContent.contains("study")) {
            type = PostType.EDUCATION;
            tags = Arrays.asList("Education", "Learning");
        } else {
            type = PostType.ACHIEVEMENT;
            tags = Arrays.asList("Achievement");
        }

        return new GeminiResponse(type, tags);
    }
} 