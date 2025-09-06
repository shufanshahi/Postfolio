package com.example.aiservice.service;

import com.example.aiservice.client.GeminiClient;
import com.example.aiservice.dto.PostProcessingRequest;
import com.example.aiservice.dto.PostProcessingResponse;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostAIService {

    private final GeminiClient geminiClient;
    private final Gson gson = new Gson();

    @Async
    public CompletableFuture<PostProcessingResponse> processPostAsync(PostProcessingRequest request) {
        try {
            log.info("Starting AI processing for post ID: {}", request.getPostId());

            String prompt = buildPrompt(request.getContent());
            String geminiResponse = geminiClient.generateContent(prompt);

            PostProcessingResponse response = parseGeminiResponse(geminiResponse, request.getPostId());

            log.info("Completed AI processing for post ID: {}", request.getPostId());
            return CompletableFuture.completedFuture(response);

        } catch (Exception e) {
            log.error("Error processing post with AI for post ID: {}", request.getPostId(), e);
            return CompletableFuture.completedFuture(
                    PostProcessingResponse.builder()
                            .postId(request.getPostId())
                            .success(false)
                            .errorMessage("AI processing failed: " + e.getMessage())
                            .cvHeading("Manual review required")
                            .tags(new ArrayList<>())
                            .autoTagged(false)
                            .build());
        }
    }

    public PostProcessingResponse processPost(PostProcessingRequest request) {
        try {
            String prompt = buildPrompt(request.getContent());
            String geminiResponse = geminiClient.generateContent(prompt);
            return parseGeminiResponse(geminiResponse, request.getPostId());
        } catch (Exception e) {
            log.error("Error processing post with AI for post ID: {}", request.getPostId(), e);
            return PostProcessingResponse.builder()
                    .postId(request.getPostId())
                    .success(false)
                    .errorMessage("AI processing failed: " + e.getMessage())
                    .cvHeading("Manual review required")
                    .tags(new ArrayList<>())
                    .autoTagged(false)
                    .build();
        }
    }

    private String buildPrompt(String content) {
        return """
                Analyze this post and determine if it's relevant for a professional CV/resume or just a general social media post.

                Return STRICT JSON format with:
                1. "summary" (a concise 5-7 word summary suitable for a CV heading - ONLY if CV-relevant, otherwise "General Post")
                2. "type" (choose one: EXPERIENCE, SKILL, PROJECT, ACHIEVEMENT, or GENERAL)
                3. "tags" (comma-separated format based on type - see guidelines below)

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
                - EXPERIENCE: Work roles, internships, jobs, starting new positions
                - PROJECT: Only if post is primarily about building/developing something WITHOUT mentioning competitive wins or achievements
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
                - Words indicating EXPERIENCE: "started working", "joined", "began", "appointed as", "hired as", "new role", "position at"
                - Competition contexts: "hackathon", "competition", "contest", "championship", "tournament" + achievement words = ACHIEVEMENT type
                - Even if technical project details are mentioned, winning/placing takes PRIORITY for classification

                TAGS GUIDELINES BY TYPE:

                FOR EXPERIENCE TYPE ONLY:
                - Include: Company name, Job title/position, Date (if mentioned, otherwise "none")
                - Format: "Company Name,Job Title,Date" or "Company Name,Job Title,none" if no date
                - Example: "Robi,Junior Developer,21 January" or "Google,Software Engineer,none"

                FOR ALL OTHER TYPES (ACHIEVEMENT, PROJECT, SKILL):
                - Extract ONLY skills that are EXPLICITLY mentioned in the post content
                - DO NOT infer or assume generic skills like "Problem Solving", "Team Collaboration", "Innovation", "Leadership" unless they are specifically mentioned
                - Look for: programming languages, frameworks, tools, technologies, specific competencies that are directly stated
                - DO NOT include: event names, competition names, company names, project names, locations, dates
                - DO NOT include: generic terms like "competition", "hackathon", "datathon", "contest"
                - DO NOT assume soft skills unless explicitly mentioned (e.g., "I improved my debating skills" → "Debating")
                - Examples of GOOD extraction:
                  * "I built a web app using React and Node.js" → "React,Node.js"
                  * "Used MySQL and Django for the project" → "MySQL,Django"
                  * "Won debating competition" → "Debating"
                  * "Learned Python programming" → "Python"
                - Examples of BAD extraction:
                  * "Won NASA Space Apps Challenge" → DO NOT add "Problem Solving,Innovation,Team Collaboration"
                  * "Completed hackathon" → DO NOT add generic skills unless specifically mentioned

                FOR GENERAL TYPE:
                - Leave tags as empty string



                Guidelines for CV-relevant posts:
                - Summary should be professional and highlight key achievements
                - For EXPERIENCE: Focus on role and company ("Started position at Company", "Joined as Developer")
                - For ACHIEVEMENT: Lead with the accomplishment ("Won first place in...", "Secured championship in...")
                - For PROJECT: Focus on what was built/developed ("Built mobile app", "Developed web platform")
                - Keep summary under 10 words

                For GENERAL posts:
                - Use "General Post" as summary
                - Use "GENERAL" as type
                - Leave tags as empty string

                Return ONLY the JSON object, without any markdown formatting or additional text.

                Example responses:

                EXPERIENCE examples:
                {
                  "summary": "Started junior developer position at Robi",
                  "type": "EXPERIENCE",
                  "tags": "Robi,Junior Developer,21 January"
                }

                {
                  "summary": "Joined Google as software engineer",
                  "type": "EXPERIENCE",
                  "tags": "Google,Software Engineer,none"
                }

                ACHIEVEMENT examples:
                {
                  "summary": "Won first place in AI hackathon",
                  "type": "ACHIEVEMENT",
                  "tags": "Artificial Intelligence,Machine Learning"
                }

                {
                  "summary": "Won NASA Space Apps Challenge",
                  "type": "ACHIEVEMENT",
                  "tags": ""
                }

                {
                  "summary": "Won debating competition",
                  "type": "ACHIEVEMENT",
                  "tags": "Debating"
                }

                PROJECT examples:
                {
                  "summary": "Built e-commerce web application",
                  "type": "PROJECT",
                  "tags": "Web Development,React,Node.js,MySQL"
                }

                {
                  "summary": "Developed mobile app using Flutter",
                  "type": "PROJECT",
                  "tags": "Flutter,Mobile Development,Dart"
                }

                GENERAL post example:
                {
                  "summary": "General Post",
                  "type": "GENERAL",
                  "tags": ""
                }

                Post Content: "%s"
                """
                .formatted(content);
    }

    private PostProcessingResponse parseGeminiResponse(String response, Long postId) {
        try {
            log.info("Raw Gemini response for post {}: {}", postId, response);

            // Clean up the response to extract JSON
            String cleanResponse = response.trim();
            if (cleanResponse.startsWith("```json")) {
                cleanResponse = cleanResponse.substring(7);
            }
            if (cleanResponse.endsWith("```")) {
                cleanResponse = cleanResponse.substring(0, cleanResponse.length() - 3);
            }
            cleanResponse = cleanResponse.trim();

            log.info("Cleaned response for post {}: {}", postId, cleanResponse);

            JsonObject jsonResponse = gson.fromJson(cleanResponse, JsonObject.class);

            // Get summary (CV heading)
            String cvHeading = jsonResponse.has("summary") ? jsonResponse.get("summary").getAsString()
                    : "Professional Experience";

            // Get type
            String postType = jsonResponse.has("type") ? jsonResponse.get("type").getAsString() : "GENERAL";

            // Parse tags - expecting comma-separated string
            List<String> tags = new ArrayList<>();
            if (jsonResponse.has("tags")) {
                String tagsString = jsonResponse.get("tags").getAsString();
                if (tagsString != null && !tagsString.trim().isEmpty()) {
                    // Split by comma and clean up
                    String[] tagArray = tagsString.split(",");
                    for (String tag : tagArray) {
                        String cleanTag = tag.trim();
                        if (!cleanTag.isEmpty()) {
                            tags.add(cleanTag);
                        }
                    }
                }
            }

            boolean autoTagged = !tags.isEmpty() && !"GENERAL".equals(postType);

            log.info("Parsed response for post {}: type={}, cvHeading={}, tags={}, autoTagged={}",
                    postId, postType, cvHeading, tags, autoTagged);

            return PostProcessingResponse.builder()
                    .postId(postId)
                    .cvHeading(cvHeading)
                    .tags(tags)
                    .postType(postType)
                    .autoTagged(autoTagged)
                    .success(true)
                    .build();

        } catch (JsonSyntaxException e) {
            log.error("Failed to parse Gemini response as JSON for post {}: {}", postId, response, e);
            return createFallbackResponse(postId, response);
        } catch (Exception e) {
            log.error("Error parsing Gemini response for post {}", postId, e);
            return createFallbackResponse(postId, response);
        }
    }

    private PostProcessingResponse createFallbackResponse(Long postId, String response) {
        // Try to extract some meaningful content even if JSON parsing fails
        List<String> fallbackTags = extractKeywords(response);

        return PostProcessingResponse.builder()
                .postId(postId)
                .cvHeading("Professional Update")
                .tags(fallbackTags)
                .postType("GENERAL")
                .autoTagged(true)
                .success(true)
                .build();
    }

    private List<String> extractKeywords(String text) {
        // Simple keyword extraction as fallback
        List<String> keywords = new ArrayList<>();
        String[] words = text.toLowerCase().split("\\s+");

        List<String> techKeywords = Arrays.asList(
                "java", "python", "javascript", "react", "spring", "database",
                "api", "microservices", "docker", "kubernetes", "aws", "azure",
                "project", "development", "software", "engineering", "data",
                "machine learning", "ai", "frontend", "backend", "fullstack");

        for (String word : words) {
            if (techKeywords.contains(word) && !keywords.contains(word)) {
                keywords.add(word);
                if (keywords.size() >= 3)
                    break;
            }
        }

        return keywords;
    }
}
