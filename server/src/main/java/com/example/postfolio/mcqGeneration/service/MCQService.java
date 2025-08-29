package com.example.postfolio.mcqGeneration.service;

import com.example.postfolio.aiservice.service.MCQAIServiceManager;
import com.example.postfolio.mcqGeneration.dto.MCQGenerationRequest;
import com.example.postfolio.mcqGeneration.dto.MCQQuestionDTO;
import com.example.postfolio.mcqGeneration.dto.MCQSetResponse;
import com.example.postfolio.mcqGeneration.entity.MCQSet;
import com.example.postfolio.mcqGeneration.repository.MCQSetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MCQService {

    private final MCQSetRepository mcqSetRepository;
    private final MCQAIServiceManager mcqAIServiceManager;

    /**
     * Generate MCQs using AI microservice (Async)
     */
    public MCQSetResponse generateMCQsWithAI(MCQGenerationRequest request, Long userId) {
        try {
            log.info("Generating MCQs using AI microservice for user: {}", userId);

            // Convert to AI service request format
            com.example.postfolio.aiservice.dto.MCQGenerationRequest aiRequest = com.example.postfolio.aiservice.dto.MCQGenerationRequest
                    .builder()
                    .userId(userId)
                    .documentName(request.getDocumentName())
                    .documentContent(request.getDocumentContent())
                    .topic(request.getTopic() != null ? request.getTopic() : "General")
                    .questionCount(request.getQuestionCount() > 0 ? request.getQuestionCount() : 5)
                    .difficulty(request.getDifficulty() != null ? request.getDifficulty() : "Medium")
                    .build();

            // Send request to AI service asynchronously
            mcqAIServiceManager.generateMCQsAsync(aiRequest);

            // Return immediate response indicating processing started
            return MCQSetResponse.builder()
                    .success(true)
                    .message("MCQ generation started. Results will be available shortly.")
                    .build();

        } catch (Exception e) {
            log.error("Error generating MCQs with AI service for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Error generating MCQs: " + e.getMessage());
        }
    }

    /**
     * Generate MCQs from document content (Async) - Legacy method name for
     * compatibility
     */
    public MCQSetResponse generateMCQsFromDocument(MCQGenerationRequest request, Long userId) {
        return generateMCQsWithAI(request, userId);
    }

    /**
     * Generate MCQs using AI microservice (Sync)
     */
    public MCQSetResponse generateMCQsWithAISync(MCQGenerationRequest request, Long userId) {
        try {
            log.info("Generating MCQs synchronously using AI microservice for user: {}", userId);

            // Convert to AI service request format
            com.example.postfolio.aiservice.dto.MCQGenerationRequest aiRequest = com.example.postfolio.aiservice.dto.MCQGenerationRequest
                    .builder()
                    .userId(userId)
                    .documentName(request.getDocumentName())
                    .documentContent(request.getDocumentContent())
                    .topic(request.getTopic() != null ? request.getTopic() : "General")
                    .questionCount(request.getQuestionCount() > 0 ? request.getQuestionCount() : 5)
                    .difficulty(request.getDifficulty() != null ? request.getDifficulty() : "Medium")
                    .build();

            // Send request to AI service synchronously
            com.example.postfolio.aiservice.dto.MCQGenerationResponse aiResponse = mcqAIServiceManager
                    .generateMCQsSync(aiRequest).block();

            if (aiResponse != null && aiResponse.isSuccess()) {
                // Convert AI response to our format
                List<MCQQuestionDTO> questions = aiResponse.getQuestions().stream()
                        .map(q -> MCQQuestionDTO.builder()
                                .question(q.getQuestion())
                                .optionA(q.getOptionA())
                                .optionB(q.getOptionB())
                                .optionC(q.getOptionC())
                                .optionD(q.getOptionD())
                                .correctAnswer(q.getCorrectAnswer())
                                .explanation(q.getExplanation())
                                .build())
                        .collect(Collectors.toList());

                return MCQSetResponse.builder()
                        .id(aiResponse.getMcqSetId())
                        .documentName(aiResponse.getDocumentName())
                        .questions(questions)
                        .success(true)
                        .message("MCQs generated successfully")
                        .build();
            } else {
                throw new RuntimeException("AI service failed to generate MCQs: " +
                        (aiResponse != null ? aiResponse.getErrorMessage() : "Unknown error"));
            }

        } catch (Exception e) {
            log.error("Error generating MCQs synchronously with AI service for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Error generating MCQs: " + e.getMessage());
        }
    }

    /**
     * Get all MCQ sets for a user
     */
    public List<MCQSetResponse> getUserMCQSets(Long userId) {
        List<MCQSet> mcqSets = mcqSetRepository.findByUserId(userId);
        return mcqSets.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get specific MCQ set by ID
     */
    public MCQSetResponse getMCQSetById(Long id, Long userId) {
        MCQSet mcqSet = mcqSetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("MCQ Set not found"));
        return convertToResponse(mcqSet);
    }

    /**
     * Convert MCQSet entity to response DTO
     */
    private MCQSetResponse convertToResponse(MCQSet mcqSet) {
        List<MCQQuestionDTO> questionDTOs = mcqSet.getQuestions().stream()
                .map(q -> MCQQuestionDTO.builder()
                        .id(q.getId())
                        .question(q.getQuestion())
                        .optionA(q.getOptionA())
                        .optionB(q.getOptionB())
                        .optionC(q.getOptionC())
                        .optionD(q.getOptionD())
                        .correctAnswer(q.getCorrectAnswer())
                        .explanation(q.getExplanation())
                        .build())
                .collect(Collectors.toList());

        return MCQSetResponse.builder()
                .id(mcqSet.getId())
                .documentName(mcqSet.getDocumentName())
                .createdAt(mcqSet.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                .questions(questionDTOs)
                .success(true)
                .message("MCQ set retrieved successfully")
                .build();
    }
}