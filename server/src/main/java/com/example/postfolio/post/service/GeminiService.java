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
        2. "type" (choose one: EXPERIENCE, SKILL, PROJECT, ACHIEVEMENT, or GENERAL)
        3. "tags" (comma-separated PROFESSIONAL SKILLS only - empty string if GENERAL post or no clear skills mentioned)
        
        CV-RELEVANT posts include:
        - Work experience, internships, jobs
        - Technical skills learned or demonstrated
        - Projects built, developed, or contributed to
        - Awards, recognitions, competitions won (regardless of technical details mentioned)
        - Professional conferences, workshops attended
        - Open source contributions
        - Research work, publications
        
        TYPE CLASSIFICATION PRIORITY:
        - ACHIEVEMENT: If post mentions winning, placing, or achieving recognition in competitions, contests, hackathons, awards, certifications - PRIORITIZE this even if technical project details are mentioned
        - PROJECT: Only if post is primarily about building/developing something WITHOUT mentioning competitive wins or achievements
        - EXPERIENCE: Work roles, internships, jobs
        - SKILL: Learning new skills, attending workshops/courses without competitive element
        
        GENERAL posts include:
        - Academic results, grades, exam scores
        - Weather updates, daily activities
        - Food, entertainment, personal opinions
        - Casual social interactions
        - Holiday wishes, personal celebrations
        - Random thoughts not related to professional growth
        - Memes, jokes, casual observations
        
        KEY RECOGNITION PATTERNS:
        - Words indicating ACHIEVEMENT: "won", "first place", "secured", "achieved", "awarded", "recognized", "champion", "winner", "placed", "ranked"
        - Competition contexts: "hackathon", "competition", "contest", "championship", "tournament" + achievement words = ACHIEVEMENT type
        - Even if technical project details are mentioned, winning/placing takes PRIORITY for classification
        
        IMPORTANT GUIDELINES FOR TAGS:
        - Extract ONLY transferable professional skills, technical competencies, and soft skills
        - DO NOT include: event names, competition names, company names, project names, locations, dates
        - DO NOT include: generic terms like "competition", "hackathon", "datathon", "contest"
        - Focus on WHAT SKILLS were demonstrated or used, not WHERE or WHEN
        
        Examples of GOOD tags:
        - Technical skills: "Machine Learning", "Data Analysis", "Python", "React", "Cloud Computing"
        - Soft skills: "Team Leadership", "Problem Solving", "Public Speaking", "Project Management"
        - Domain expertise: "Financial Modeling", "UI/UX Design", "Digital Marketing", "Research"
        
        Examples of BAD tags (DO NOT use):
        - Event names: "Google Summer of Code", "NASA Space Apps", "Datathon"
        - Generic terms: "Competition", "Hackathon", "Conference", "Workshop"
        - Companies: "Google", "Microsoft", "Facebook"
        - Locations: "Silicon Valley", "Dhaka University"
        
        Guidelines for CV-relevant posts:
        - Summary should be professional and highlight key achievements
        - For ACHIEVEMENT: Lead with the accomplishment ("Won first place in...", "Secured championship in...", "Achieved recognition for...")
        - For PROJECT: Focus on what was built/developed ("Built mobile app", "Developed web platform")
        - For EXPERIENCE: Focus on role and impact ("Completed internship", "Led development team")
        - Keep summary under 10 words
        
        For GENERAL posts:
        - Use "General Post" as summary
        - Use "GENERAL" as type
        - Leave tags as empty string
        
        Return ONLY the JSON object, without any markdown formatting or additional text.
        
        Example CV-relevant responses:
        
        ACHIEVEMENT examples:
        {
          "summary": "Won first place in AI hackathon",
          "type": "ACHIEVEMENT", 
          "tags": "Artificial Intelligence,Problem Solving,Team Collaboration"
        }
        
        {
          "summary": "Secured championship in data competition",
          "type": "ACHIEVEMENT",
          "tags": "Data Analysis,Machine Learning,Problem Solving"
        }
        
        PROJECT examples:
        {
          "summary": "Built e-commerce web application",
          "type": "PROJECT",
          "tags": "Web Development,React,Node.js,Full Stack Development"
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