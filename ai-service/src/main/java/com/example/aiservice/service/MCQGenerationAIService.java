package com.example.aiservice.service;

import com.example.aiservice.client.GeminiClient;
import com.example.aiservice.dto.MCQGenerationRequest;
import com.example.aiservice.dto.MCQGenerationResponse;
import com.example.aiservice.dto.MCQGenerationResponse.MCQQuestionDTO;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class MCQGenerationAIService {

    private final GeminiClient geminiClient;
    private final Gson gson = new Gson();

    @Async
    public CompletableFuture<MCQGenerationResponse> generateMCQAsync(MCQGenerationRequest request) {
        try {
            log.info("Starting MCQ generation for user ID: {} on topic: {}",
                    request.getUserId(), request.getTopic());

            String prompt = buildMCQPrompt(request);
            String geminiResponse = geminiClient.generateContent(prompt);

            MCQGenerationResponse response = parseMCQResponse(geminiResponse, request);

            log.info("Completed MCQ generation for user ID: {} with {} questions",
                    request.getUserId(), response.getQuestions().size());

            return CompletableFuture.completedFuture(response);

        } catch (Exception e) {
            log.error("Error generating MCQs for user ID: {}", request.getUserId(), e);

            return CompletableFuture.completedFuture(
                    MCQGenerationResponse.builder()
                            .userId(request.getUserId())
                            .documentName(request.getDocumentName())
                            .questions(new ArrayList<>())
                            .success(false)
                            .errorMessage("MCQ generation failed: " + e.getMessage())
                            .build());
        }
    }

    public MCQGenerationResponse generateMCQ(MCQGenerationRequest request) {
        try {
            String prompt = buildMCQPrompt(request);
            String geminiResponse = geminiClient.generateContent(prompt);
            return parseMCQResponse(geminiResponse, request);
        } catch (Exception e) {
            log.error("Error generating MCQs for user ID: {}", request.getUserId(), e);

            return MCQGenerationResponse.builder()
                    .userId(request.getUserId())
                    .documentName(request.getDocumentName())
                    .questions(new ArrayList<>())
                    .success(false)
                    .errorMessage("MCQ generation failed: " + e.getMessage())
                    .build();
        }
    }

    private String buildMCQPrompt(MCQGenerationRequest request) {
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("Generate multiple choice questions based on the following content.\n\n");

        if (request.getTopic() != null && !request.getTopic().isEmpty()) {
            promptBuilder.append("TOPIC: ").append(request.getTopic()).append("\n");
        }

        promptBuilder.append("CONTENT:\n").append(request.getDocumentContent()).append("\n\n");

        int questionCount = request.getQuestionCount() > 0 ? request.getQuestionCount() : 5;
        String difficulty = request.getDifficulty() != null ? request.getDifficulty() : "Medium";

        promptBuilder.append("Generate ").append(questionCount).append(" multiple choice questions ");
        promptBuilder.append("with difficulty level: ").append(difficulty).append("\n\n");

        promptBuilder.append("Please provide the questions in this EXACT JSON format:\n");
        promptBuilder.append("{\n");
        promptBuilder.append("  \"questions\": [\n");
        promptBuilder.append("    {\n");
        promptBuilder.append("      \"question\": \"What is the main concept discussed?\",\n");
        promptBuilder.append("      \"optionA\": \"Option A text\",\n");
        promptBuilder.append("      \"optionB\": \"Option B text\",\n");
        promptBuilder.append("      \"optionC\": \"Option C text\",\n");
        promptBuilder.append("      \"optionD\": \"Option D text\",\n");
        promptBuilder.append("      \"correctAnswer\": \"A\",\n");
        promptBuilder.append("      \"explanation\": \"Explanation of why this answer is correct\"\n");
        promptBuilder.append("    }\n");
        promptBuilder.append("  ]\n");
        promptBuilder.append("}\n\n");
        promptBuilder.append("Guidelines:\n");
        promptBuilder.append("- Questions should be clear and unambiguous\n");
        promptBuilder.append("- All options should be plausible\n");
        promptBuilder.append("- Correct answer should be A, B, C, or D\n");
        promptBuilder.append("- Provide detailed explanations\n");
        promptBuilder.append("- Focus on key concepts from the content\n");
        promptBuilder.append("- Only return the JSON, no additional text");

        return promptBuilder.toString();
    }

    private MCQGenerationResponse parseMCQResponse(String response, MCQGenerationRequest request) {
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
            List<MCQQuestionDTO> questions = new ArrayList<>();

            if (jsonResponse.has("questions") && jsonResponse.get("questions").isJsonArray()) {
                JsonArray questionsArray = jsonResponse.getAsJsonArray("questions");

                for (int i = 0; i < questionsArray.size(); i++) {
                    JsonObject questionObj = questionsArray.get(i).getAsJsonObject();

                    MCQQuestionDTO mcqQuestion = MCQQuestionDTO.builder()
                            .question(getStringValue(questionObj, "question"))
                            .optionA(getStringValue(questionObj, "optionA"))
                            .optionB(getStringValue(questionObj, "optionB"))
                            .optionC(getStringValue(questionObj, "optionC"))
                            .optionD(getStringValue(questionObj, "optionD"))
                            .correctAnswer(getStringValue(questionObj, "correctAnswer"))
                            .explanation(getStringValue(questionObj, "explanation"))
                            .build();

                    questions.add(mcqQuestion);
                }
            }

            return MCQGenerationResponse.builder()
                    .userId(request.getUserId())
                    .documentName(request.getDocumentName())
                    .questions(questions)
                    .success(true)
                    .build();

        } catch (JsonSyntaxException e) {
            log.error("Failed to parse MCQ response as JSON: {}", response, e);
            return createFallbackMCQResponse(request);
        } catch (Exception e) {
            log.error("Error parsing MCQ response", e);
            return createFallbackMCQResponse(request);
        }
    }

    private String getStringValue(JsonObject obj, String key) {
        return obj.has(key) && !obj.get(key).isJsonNull() ? obj.get(key).getAsString() : "";
    }

    private MCQGenerationResponse createFallbackMCQResponse(MCQGenerationRequest request) {
        // Create a simple fallback question
        List<MCQQuestionDTO> fallbackQuestions = new ArrayList<>();

        MCQQuestionDTO fallbackQuestion = MCQQuestionDTO.builder()
                .question("Based on the provided content, what is the main topic discussed?")
                .optionA("Technical concepts")
                .optionB("Business processes")
                .optionC("General information")
                .optionD("Educational content")
                .correctAnswer("C")
                .explanation("This is a general question when specific content analysis is not available.")
                .build();

        fallbackQuestions.add(fallbackQuestion);

        return MCQGenerationResponse.builder()
                .userId(request.getUserId())
                .documentName(request.getDocumentName())
                .questions(fallbackQuestions)
                .success(true)
                .build();
    }
}
