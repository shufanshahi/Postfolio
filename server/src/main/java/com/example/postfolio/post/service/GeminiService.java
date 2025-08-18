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
            Analyze this post and determine if it's relevant for a professional CV/resume or just a general social media post.
            
            Return STRICT JSON format with:
            1. "summary" (a concise 5-7 word summary suitable for a CV heading - ONLY if CV-relevant, otherwise "General Post")
            2. "type" (choose one: EXPERIENCE, EDUCATION, SKILL, PROJECT, ACHIEVEMENT, or GENERAL)
            3. "tags" (comma-separated relevant professional skills/topics - empty string if GENERAL post)
            
            CV-RELEVANT posts include:
            - Work experience, internships, jobs
            - Educational achievements, courses, certifications
            - Technical skills learned or demonstrated
            - Projects built, developed, or contributed to
            - Awards, recognitions, competitions won
            - Professional conferences, workshops attended
            - Open source contributions
            - Research work, publications
            
            GENERAL posts include:
            - Weather updates, daily activities
            - Food, entertainment, personal opinions
            - Casual social interactions
            - Holiday wishes, personal celebrations
            - Random thoughts not related to professional growth
            - Memes, jokes, casual observations
            
            Guidelines for CV-relevant posts:
            - Summary should be professional and highlight key achievements
            - For experience: focus on role and impact
            - For projects: highlight technology and purpose
            - For education: include qualification and institution if mentioned
            - Keep summary under 10 words
            
            For GENERAL posts:
            - Use "General Post" as summary
            - Use "GENERAL" as type
            - Leave tags as empty string
            
            Return ONLY the JSON object, without any markdown formatting or additional text.
            
            Example CV-relevant response:
            {
              "summary": "Led React migration project",
              "type": "PROJECT",
              "tags": "React,Node.js,Team Leadership"
            }
            
            Example GENERAL post response:
            {
              "summary": "General Post",
              "type": "GENERAL",
              "tags": ""
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
            generationConfig.addProperty("temperature", 0.2); // Even lower temperature for consistent classification
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

            String jsonContent = extractJsonFromText(text);
            JsonObject result = JsonParser.parseString(jsonContent).getAsJsonObject();

            // Validate response structure
            if (!result.has("summary") || !result.has("type") || !result.has("tags")) {
                throw new RuntimeException("Invalid Gemini response format - missing required fields");
            }

            // Parse summary
            String summary = result.get("summary").getAsString().trim();
            if (summary.length() > 100) {
                summary = summary.substring(0, 97) + "...";
            }

            // Parse type
            PostType type;
            try {
                type = PostType.valueOf(result.get("type").getAsString());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid post type received, defaulting to GENERAL");
                type = PostType.GENERAL;
            }

            // Parse tags
            String tagsString = result.get("tags").getAsString();
            List<String> tags = new ArrayList<>();

            // Only process tags if it's not a GENERAL post
            if (type != PostType.GENERAL && !tagsString.isBlank()) {
                tags = Arrays.stream(tagsString.split(",\\s*"))
                        .filter(tag -> !tag.isBlank())
                        .map(String::trim)
                        .collect(ArrayList::new, (list, item) -> list.add(item), ArrayList::addAll);
            }

            // For non-general posts, ensure we have at least one tag
            if (type != PostType.GENERAL && tags.isEmpty()) {
                tags = List.of("General");
            }

            return new GeminiResponse(summary, type, tags);
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
        private final String summary;
        private final PostType postType;
        private final List<String> tags;

        // Helper method to check if post should be added to CV
        public boolean isCvRelevant() {
            return postType != PostType.GENERAL;
        }
    }
}