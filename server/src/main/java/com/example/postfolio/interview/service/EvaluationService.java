package com.example.postfolio.interview.service;

import com.example.postfolio.aiservice.dto.InterviewEvaluationRequest;
import com.example.postfolio.aiservice.dto.InterviewEvaluationResponse;
import com.example.postfolio.aiservice.service.AIServiceManager;
import com.example.postfolio.interview.dto.EvaluationRequest;
import com.example.postfolio.interview.dto.EvaluationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final AIServiceManager aiServiceManager;

    public EvaluationResponse evaluateInterview(EvaluationRequest request) {
        try {
            // Convert server DTO to AI service DTO
            InterviewEvaluationRequest aiRequest = convertToAIRequest(request);
            
            // Call AI service
            InterviewEvaluationResponse aiResponse = aiServiceManager.evaluateInterview(aiRequest);
            
            if (!aiResponse.isSuccess()) {
                throw new RuntimeException("AI service failed: " + aiResponse.getErrorMessage());
            }
            
            // Convert AI service response back to server DTO
            return convertToServerResponse(aiResponse);
            
        } catch (Exception e) {
            throw new RuntimeException("Error calling AI service for evaluation: " + e.getMessage(), e);
        }
    }

    private InterviewEvaluationRequest convertToAIRequest(EvaluationRequest request) {
        List<InterviewEvaluationRequest.QuestionAnswer> aiQuestionAnswers = new ArrayList<>();
        
        for (EvaluationRequest.QuestionAnswer qa : request.getQuestionAnswers()) {
            InterviewEvaluationRequest.QuestionAnswer aiQA = InterviewEvaluationRequest.QuestionAnswer.builder()
                    .question(qa.getQuestion())
                    .answer(qa.getAnswer())
                    .build();
            aiQuestionAnswers.add(aiQA);
        }
        
        return InterviewEvaluationRequest.builder()
                .questionAnswers(aiQuestionAnswers)
                .build();
    }

    private EvaluationResponse convertToServerResponse(InterviewEvaluationResponse aiResponse) {
        EvaluationResponse response = new EvaluationResponse();
        response.setRating(aiResponse.getRating());
        response.setStrengths(aiResponse.getStrengths());
        response.setWeaknesses(aiResponse.getWeaknesses());
        response.setImprovements(aiResponse.getImprovements());
        return response;
    }
}
