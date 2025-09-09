package com.example.aiservice.service;

import com.example.aiservice.client.GeminiClient;
import com.example.aiservice.dto.JobMatchingRequest;
import com.example.aiservice.dto.JobMatchingResponse;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobMatchingAIService {

    private final GeminiClient geminiClient;
    private final Gson gson = new Gson();

    public JobMatchingResponse matchJob(JobMatchingRequest request) {
        try {
            log.info("Starting job matching for job ID: {} and profile ID: {}",
                    request.getJobId(), request.getProfileId());

            String prompt = buildJobMatchingPrompt(request);
            String geminiResponse = geminiClient.generateContent(prompt);
            JobMatchingResponse response = parseJobMatchingResponse(geminiResponse, request);

            log.info("AI service returning score: {} for job: {} and profile: {}",
                    response.getScore(), request.getJobId(), request.getProfileId());

            return response;
        } catch (Exception e) {
            log.error("Error in job matching for job ID: {} and profile ID: {}",
                    request.getJobId(), request.getProfileId(), e);

            return JobMatchingResponse.builder()
                    .jobId(request.getJobId())
                    .profileId(request.getProfileId())
                    .score(0.0)
                    .success(false)
                    .errorMessage("Job matching failed: " + e.getMessage())
                    .explanation("Unable to calculate match score due to processing error")
                    .build();
        }
    }

    private String buildJobMatchingPrompt(JobMatchingRequest request) {
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("Analyze the job-candidate match and provide a detailed scoring analysis.\n\n");

        promptBuilder.append("JOB DETAILS:\n");
        promptBuilder.append("Title: ").append(request.getJobTitle()).append("\n");
        promptBuilder.append("Description: ").append(request.getJobDescription()).append("\n");
        promptBuilder.append("Requirements: ").append(request.getJobRequirements()).append("\n");
        promptBuilder.append("Skills: ").append(request.getJobSkills()).append("\n");
        promptBuilder.append("Experience: ").append(request.getJobExperience()).append("\n");
        promptBuilder.append("Location: ").append(request.getJobLocation()).append("\n\n");

        promptBuilder.append("CANDIDATE PROFILE:\n");
        promptBuilder.append("Skills: ").append(request.getProfileSkills()).append("\n");
        promptBuilder.append("Work Experience: ").append(request.getProfileWorkExperience() != null ? String.join(", ", request.getProfileWorkExperience()) : "None").append("\n");

        // Education details from education service
        promptBuilder.append("EDUCATION BACKGROUND:\n");
        if (request.getSscResult() != null && !request.getSscResult().isEmpty()) {
            promptBuilder.append("SSC Result: ").append(request.getSscResult()).append("\n");
        }
        if (request.getHscResult() != null && !request.getHscResult().isEmpty()) {
            promptBuilder.append("HSC Result: ").append(request.getHscResult()).append("\n");
        }

        // Handle multiple degrees
        if (request.getDegreeNames() != null && request.getDegreeNames().length > 0) {
            promptBuilder.append("Degrees:\n");
            for (int i = 0; i < request.getDegreeNames().length; i++) {
                String degreeName = request.getDegreeNames()[i];
                String cgpa = (request.getCgpas() != null && i < request.getCgpas().length)
                        ? request.getCgpas()[i]
                        : "N/A";

                if (degreeName != null && !degreeName.isEmpty()) {
                    promptBuilder.append("  - ").append(degreeName);
                    if (cgpa != null && !cgpa.isEmpty() && !"N/A".equals(cgpa)) {
                        promptBuilder.append(" (CGPA: ").append(cgpa).append(")");
                    }
                    promptBuilder.append("\n");
                }
            }
        }
        promptBuilder.append("\n");

        promptBuilder
                .append("Please analyze the job-candidate match and provide analysis in this EXACT JSON format:\n");
        promptBuilder.append("{\n");
        promptBuilder.append("  \"score\": any number between 0 and 100,\n");
        promptBuilder.append("  \"explanation\": \"Overall match analysis summary\",\n");
        promptBuilder.append("  \"strengths\": \"Key strengths and matching qualifications\",\n");
        promptBuilder.append("  \"gaps\": \"Areas where candidate falls short\",\n");
        promptBuilder.append("  \"recommendations\": \"Suggestions for improving match\"\n");
        promptBuilder.append("}\n\n");
        promptBuilder.append("IMPORTANT: Replace the score with your calculated match percentage (0-100).\n");
        promptBuilder.append("Guidelines:\n");
        promptBuilder.append("- Score should be between 0 and 100 (integer value)\n");
        promptBuilder.append(
                "- Consider skills match, experience level, location compatibility, and educational background\n");
        promptBuilder
                .append("- Educational qualifications should be weighted appropriately based on job requirements\n");
        promptBuilder.append("- Provide specific, actionable insights\n");
        promptBuilder.append("- Only return the JSON, no additional text");

        // Console log the prompt information for debugging
        String finalPrompt = promptBuilder.toString();
        log.info("=== JOB MATCHING PROMPT DETAILS ===");
        log.info("Job ID: {}", request.getJobId());
        log.info("Profile ID: {}", request.getProfileId());
        log.info("Job Title: {}", request.getJobTitle());
        log.info("Job Skills: {}", request.getJobSkills());
        log.info("Profile Skills: {}", request.getProfileSkills());
        log.info("SSC Result: {}", request.getSscResult());
        log.info("HSC Result: {}", request.getHscResult());
        log.info("Degree Names: {}",
                request.getDegreeNames() != null ? String.join(", ", request.getDegreeNames()) : "None");
        log.info("CGPAs: {}", request.getCgpas() != null ? String.join(", ", request.getCgpas()) : "None");
        log.info("Work Experience: {}", request.getProfileWorkExperience() != null ? String.join(", ", request.getProfileWorkExperience()) : "None");
        log.info("=== FULL PROMPT SENT TO GEMINI ===");
        log.info("{}", finalPrompt);
        log.info("=== END OF PROMPT ===");

        return finalPrompt;
    }

    private JobMatchingResponse parseJobMatchingResponse(String response, JobMatchingRequest request) {
        try {
            // Clean up the response to extract JSON
            String cleanResponse = response.trim();
            if (cleanResponse.startsWith("```json")) {
                cleanResponse = cleanResponse.substring(7);
            }
            if (cleanResponse.endsWith("```")) {
                cleanResponse = cleanResponse.substring(0, cleanResponse.length() - 3);
            }
            cleanResponse = cleanResponse.trim();

            JsonObject jsonResponse = gson.fromJson(cleanResponse, JsonObject.class);

            double score = jsonResponse.has("score") ? jsonResponse.get("score").getAsDouble() : 0.0;

            String explanation = jsonResponse.has("explanation") ? jsonResponse.get("explanation").getAsString()
                    : "Match analysis completed";

            String strengths = jsonResponse.has("strengths") ? jsonResponse.get("strengths").getAsString()
                    : "No specific strengths identified";

            String gaps = jsonResponse.has("gaps") ? jsonResponse.get("gaps").getAsString()
                    : "No specific gaps identified";

            String recommendations = jsonResponse.has("recommendations")
                    ? jsonResponse.get("recommendations").getAsString()
                    : "No specific recommendations available";

            // Ensure score is within valid range (0-100)
            score = Math.max(0.0, Math.min(100.0, score));

            return JobMatchingResponse.builder()
                    .jobId(request.getJobId())
                    .profileId(request.getProfileId())
                    .score(score)
                    .explanation(explanation)
                    .strengths(strengths)
                    .gaps(gaps)
                    .recommendations(recommendations)
                    .success(true)
                    .build();

        } catch (JsonSyntaxException e) {
            log.error("Failed to parse job matching response as JSON: {}", response, e);
            return createFallbackJobMatchingResponse(request, response);
        } catch (Exception e) {
            log.error("Error parsing job matching response", e);
            return createFallbackJobMatchingResponse(request, response);
        }
    }

    private JobMatchingResponse createFallbackJobMatchingResponse(JobMatchingRequest request, String response) {
        // Simple fallback scoring based on keyword matching
        double fallbackScore = calculateSimpleMatch(request);

        return JobMatchingResponse.builder()
                .jobId(request.getJobId())
                .profileId(request.getProfileId())
                .score(fallbackScore)
                .explanation("Fallback analysis: Basic skill and experience matching")
                .strengths("General qualifications considered")
                .gaps("Detailed analysis unavailable")
                .recommendations("Manual review recommended")
                .success(true)
                .build();
    }

    private double calculateSimpleMatch(JobMatchingRequest request) {
        // Simple keyword-based matching as fallback
        int matchCount = 0;
        int totalCriteria = 0;

        String jobText = (request.getJobSkills() + " " + request.getJobRequirements()).toLowerCase();
        String profileText = (request.getProfileSkills() + " " + request.getProfileBio()).toLowerCase();

        String[] jobKeywords = jobText.split("[\\s,]+");
        String[] profileKeywords = profileText.split("[\\s,]+");

        for (String jobKeyword : jobKeywords) {
            if (jobKeyword.length() > 3) { // Ignore short words
                totalCriteria++;
                for (String profileKeyword : profileKeywords) {
                    if (profileKeyword.contains(jobKeyword) || jobKeyword.contains(profileKeyword)) {
                        matchCount++;
                        break;
                    }
                }
            }
        }

        return totalCriteria > 0 ? Math.min(100.0, (double) matchCount / totalCriteria * 100) : 50.0;
    }
}
