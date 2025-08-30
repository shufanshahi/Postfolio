package com.example.aiservice.service;

import com.example.aiservice.client.GeminiClient;
import com.example.aiservice.dto.InterviewGenerationRequest;
import com.example.aiservice.dto.InterviewGenerationResponse;
import com.example.aiservice.dto.InterviewGenerationResponse.InterviewQuestionDTO;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
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
public class InterviewGenerationAIService {

    private final GeminiClient geminiClient;
    private final Gson gson = new Gson();

    @Async
    public CompletableFuture<InterviewGenerationResponse> generateInterviewAsync(InterviewGenerationRequest request) {
        try {
            log.info("Starting interview generation for user ID: {} for role: {}",
                    request.getUserId(), request.getJobRole());

            String prompt = buildInterviewPrompt(request);
            String geminiResponse = geminiClient.generateContent(prompt);

            InterviewGenerationResponse response = parseInterviewResponse(geminiResponse, request);

            log.info("Completed interview generation for user ID: {} with {} questions",
                    request.getUserId(), response.getQuestions().size());

            return CompletableFuture.completedFuture(response);

        } catch (Exception e) {
            log.error("Error generating interview questions for user ID: {}", request.getUserId(), e);

            return CompletableFuture.completedFuture(
                    InterviewGenerationResponse.builder()
                            .userId(request.getUserId())
                            .jobRole(request.getJobRole())
                            .questions(new ArrayList<>())
                            .success(false)
                            .errorMessage("Interview generation failed: " + e.getMessage())
                            .build());
        }
    }

    public InterviewGenerationResponse generateInterview(InterviewGenerationRequest request) {
        try {
            String prompt = buildInterviewPrompt(request);
            String geminiResponse = geminiClient.generateContent(prompt);
            return parseInterviewResponse(geminiResponse, request);
        } catch (Exception e) {
            log.error("Error generating interview questions for user ID: {}", request.getUserId(), e);

            return InterviewGenerationResponse.builder()
                    .userId(request.getUserId())
                    .jobRole(request.getJobRole())
                    .questions(new ArrayList<>())
                    .success(false)
                    .errorMessage("Interview generation failed: " + e.getMessage())
                    .build();
        }
    }

    private String buildInterviewPrompt(InterviewGenerationRequest request) {
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("Generate professional interview questions for the following job role.\n\n");

        promptBuilder.append("JOB ROLE: ").append(request.getJobRole()).append("\n");

        if (request.getExperience() != null) {
            promptBuilder.append("EXPERIENCE LEVEL: ").append(request.getExperience()).append("\n");
        }

        if (request.getCompany() != null) {
            promptBuilder.append("COMPANY: ").append(request.getCompany()).append("\n");
        }

        if (request.getInterviewType() != null) {
            promptBuilder.append("INTERVIEW TYPE: ").append(request.getInterviewType()).append("\n");
        }

        if (request.getSkills() != null) {
            promptBuilder.append("REQUIRED SKILLS: ").append(request.getSkills()).append("\n");
        }

        int questionCount = request.getQuestionCount() > 0 ? request.getQuestionCount() : 10;
        promptBuilder.append("\nGenerate ").append(questionCount).append(" interview questions.\n\n");

        promptBuilder.append("Please provide the questions in this EXACT JSON format:\n");
        promptBuilder.append("{\n");
        promptBuilder.append("  \"questions\": [\n");
        promptBuilder.append("    {\n");
        promptBuilder.append("      \"question\": \"Tell me about your experience with...\",\n");
        promptBuilder.append("      \"category\": \"Technical|Behavioral|Situational|General\",\n");
        promptBuilder.append("      \"difficulty\": \"Easy|Medium|Hard\",\n");
        promptBuilder.append("      \"sampleAnswer\": \"A good answer would include...\",\n");
        promptBuilder.append("      \"keyPoints\": [\"point1\", \"point2\", \"point3\"]\n");
        promptBuilder.append("    }\n");
        promptBuilder.append("  ]\n");
        promptBuilder.append("}\n\n");
        promptBuilder.append("Guidelines:\n");
        promptBuilder.append("- Mix of technical, behavioral, and situational questions\n");
        promptBuilder.append("- Questions should be relevant to the specific role\n");
        promptBuilder.append("- Include varied difficulty levels\n");
        promptBuilder.append("- Provide helpful sample answers and key points\n");
        promptBuilder.append("- Questions should be professional and appropriate\n");
        promptBuilder.append("- Only return the JSON, no additional text");

        return promptBuilder.toString();
    }

    private InterviewGenerationResponse parseInterviewResponse(String response, InterviewGenerationRequest request) {
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
            List<InterviewQuestionDTO> questions = new ArrayList<>();

            if (jsonResponse.has("questions") && jsonResponse.get("questions").isJsonArray()) {
                JsonArray questionsArray = jsonResponse.getAsJsonArray("questions");

                for (int i = 0; i < questionsArray.size(); i++) {
                    JsonObject questionObj = questionsArray.get(i).getAsJsonObject();

                    List<String> keyPoints = new ArrayList<>();
                    if (questionObj.has("keyPoints") && questionObj.get("keyPoints").isJsonArray()) {
                        JsonArray keyPointsArray = questionObj.getAsJsonArray("keyPoints");
                        for (int j = 0; j < keyPointsArray.size(); j++) {
                            keyPoints.add(keyPointsArray.get(j).getAsString());
                        }
                    }

                    InterviewQuestionDTO interviewQuestion = InterviewQuestionDTO.builder()
                            .question(getStringValue(questionObj, "question"))
                            .category(getStringValue(questionObj, "category"))
                            .difficulty(getStringValue(questionObj, "difficulty"))
                            .sampleAnswer(getStringValue(questionObj, "sampleAnswer"))
                            .keyPoints(keyPoints)
                            .build();

                    questions.add(interviewQuestion);
                }
            }

            return InterviewGenerationResponse.builder()
                    .userId(request.getUserId())
                    .jobRole(request.getJobRole())
                    .questions(questions)
                    .success(true)
                    .build();

        } catch (JsonSyntaxException e) {
            log.error("Failed to parse interview response as JSON: {}", response, e);
            return createFallbackInterviewResponse(request);
        } catch (Exception e) {
            log.error("Error parsing interview response", e);
            return createFallbackInterviewResponse(request);
        }
    }

    private String getStringValue(JsonObject obj, String key) {
        return obj.has(key) && !obj.get(key).isJsonNull() ? obj.get(key).getAsString() : "";
    }

    private InterviewGenerationResponse createFallbackInterviewResponse(InterviewGenerationRequest request) {
        List<InterviewQuestionDTO> fallbackQuestions = new ArrayList<>();

        // Create some basic fallback questions
        fallbackQuestions.add(InterviewQuestionDTO.builder()
                .question("Tell me about yourself and your background.")
                .category("General")
                .difficulty("Easy")
                .sampleAnswer("Provide a brief professional summary highlighting relevant experience.")
                .keyPoints(Arrays.asList("Professional background", "Key achievements", "Career goals"))
                .build());

        fallbackQuestions.add(InterviewQuestionDTO.builder()
                .question("Why are you interested in this role?")
                .category("Behavioral")
                .difficulty("Medium")
                .sampleAnswer("Express genuine interest and align with company values.")
                .keyPoints(Arrays.asList("Company research", "Role alignment", "Career motivation"))
                .build());

        fallbackQuestions.add(InterviewQuestionDTO.builder()
                .question("Describe a challenging situation you faced and how you handled it.")
                .category("Situational")
                .difficulty("Medium")
                .sampleAnswer("Use the STAR method (Situation, Task, Action, Result).")
                .keyPoints(Arrays.asList("Problem-solving", "Leadership", "Results"))
                .build());

        return InterviewGenerationResponse.builder()
                .userId(request.getUserId())
                .jobRole(request.getJobRole())
                .questions(fallbackQuestions)
                .success(true)
                .build();
    }
}
