package com.example.aiservice.service;

import com.example.aiservice.client.GeminiClient;
import com.example.aiservice.dto.InterviewEvaluationRequest;
import com.example.aiservice.dto.InterviewEvaluationResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterviewEvaluationAIService {

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public InterviewEvaluationResponse evaluateInterview(InterviewEvaluationRequest request) {
        try {
            log.info("Evaluating interview with {} Q&A pairs", request.getQuestionAnswers().size());

            String prompt = buildEvaluationPrompt(request);
            String geminiResponse = geminiClient.generateContent(prompt);
            
            return parseEvaluationResponse(geminiResponse);
            
        } catch (Exception e) {
            log.error("Error evaluating interview", e);
            return InterviewEvaluationResponse.builder()
                    .rating(0)
                    .strengths(new ArrayList<>())
                    .weaknesses(new ArrayList<>())
                    .improvements(new ArrayList<>())
                    .success(false)
                    .errorMessage("Failed to evaluate interview: " + e.getMessage())
                    .build();
        }
    }

    private String buildEvaluationPrompt(InterviewEvaluationRequest request) {
        StringBuilder interviewQA = new StringBuilder();
        
        for (int i = 0; i < request.getQuestionAnswers().size(); i++) {
            InterviewEvaluationRequest.QuestionAnswer qa = request.getQuestionAnswers().get(i);
            interviewQA.append(String.format("Q%d: %s\n", i + 1, qa.getQuestion()));
            interviewQA.append(String.format("A%d: %s\n\n", i + 1, qa.getAnswer()));
        }

        return String.format("""
            You are an interview evaluator. You will receive a list of interview questions and answers. Based on these, you must assess how well the candidate performed in the interview.
            
            Here are the interview Q&A pairs:
            
            %s
            
            Please evaluate the candidate's performance by:
            1. Giving a rating out of 100.
            2. Listing the main strengths shown in the answers.
            3. Pointing out the weaknesses or lackings.
            4. Suggesting clear and actionable improvements.
            
            Return the response as a JSON object with the following format:
            {
              "rating": number,
              "strengths": ["...", "..."],
              "weaknesses": ["...", "..."],
              "improvements": ["...", "..."]
            }
            
            Make sure to provide specific, actionable feedback based on the actual responses given by the candidate.
            """, interviewQA.toString());
    }

    private InterviewEvaluationResponse parseEvaluationResponse(String geminiResponse) {
        try {
            // Extract JSON from the response
            int jsonStart = geminiResponse.indexOf("{");
            int jsonEnd = geminiResponse.lastIndexOf("}") + 1;
            
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                String jsonResponse = geminiResponse.substring(jsonStart, jsonEnd);
                InterviewEvaluationResponse response = objectMapper.readValue(jsonResponse, InterviewEvaluationResponse.class);
                response.setSuccess(true);
                return response;
            }
            
            throw new RuntimeException("Could not parse JSON from Gemini response");
            
        } catch (Exception e) {
            log.error("Error parsing Gemini response", e);
            return InterviewEvaluationResponse.builder()
                    .rating(0)
                    .strengths(new ArrayList<>())
                    .weaknesses(new ArrayList<>())
                    .improvements(new ArrayList<>())
                    .success(false)
                    .errorMessage("Failed to parse evaluation response: " + e.getMessage())
                    .build();
        }
    }
}