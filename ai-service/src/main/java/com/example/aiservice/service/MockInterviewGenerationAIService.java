package com.example.aiservice.service;

import com.example.aiservice.client.GeminiClient;
import com.example.aiservice.dto.MockInterviewGenerationRequest;
import com.example.aiservice.dto.MockInterviewGenerationResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class MockInterviewGenerationAIService {

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MockInterviewGenerationResponse generateCustomInterview(MockInterviewGenerationRequest request) {
        try {
            log.info("Generating custom interview for role: {}, experience: {}, type: {}, questions: {}", 
                    request.getRole(), request.getExperience(), request.getInterviewType(), request.getNumQuestions());

            String prompt = buildGeminiPrompt(request.getRole(), request.getExperience(), 
                    request.getInterviewType(), request.getNumQuestions());
            
            String geminiResponse = geminiClient.generateContent(prompt);
            
            return parseGeminiResponse(geminiResponse, request);
            
        } catch (Exception e) {
            log.error("Error generating custom interview", e);
            return MockInterviewGenerationResponse.builder()
                    .role(request.getRole())
                    .experience(request.getExperience())
                    .interviewType(request.getInterviewType())
                    .questions(new ArrayList<>())
                    .success(false)
                    .errorMessage("Failed to generate custom interview: " + e.getMessage())
                    .build();
        }
    }

    private String buildGeminiPrompt(String role, String experience, String interviewType, String numQuestions) {
        return String.format("""
            You are a professional mock interview assistant. 
            Your goal is to simulate a realistic interview experience tailored to the candidate. 
            You will receive the following information:

            - Candidate role: %s
            - Candidate job experience: %s years
            - Interview type: %s 
              (e.g., Technical, HR, Behavioral, Case Study, Mixed)
            - Number of questions: %s

            Instructions:
            1. Based on the candidate's role, experience, and interview type, prepare interview questions based on the requested number (%s).
            2. Parse the number of questions from the text (e.g., "5", "five", "5 questions", etc.) and generate that many questions.
            3. If the number is unclear, generate 5 questions as default.
            4. Questions should be relevant, realistic, and at the appropriate difficulty level for someone with %s years of experience.
            5. Vary the style of questions to make it engaging (e.g., open-ended, situational, problem-solving).
            6. Do not give answers — only questions.
            7. At the start, include a short friendly introduction (as the interviewer).
            8. Return the entire response strictly as a JSON object with the following structure:

            {
              "introduction": "string",
              "role": "%s",
              "experience": "%s",
              "interviewType": "%s",
              "questions": [
                {"id": 1, "question": "string"},
                {"id": 2, "question": "string"}
              ]
            }
            """, role, experience, interviewType, numQuestions, numQuestions, experience, role, experience, interviewType);
    }

    private MockInterviewGenerationResponse parseGeminiResponse(String geminiResponse, MockInterviewGenerationRequest request) {
        try {
            // Extract JSON from the response
            int jsonStart = geminiResponse.indexOf("{");
            int jsonEnd = geminiResponse.lastIndexOf("}") + 1;
            
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                String jsonResponse = geminiResponse.substring(jsonStart, jsonEnd);
                MockInterviewGenerationResponse response = objectMapper.readValue(jsonResponse, MockInterviewGenerationResponse.class);
                response.setSuccess(true);
                return response;
            }
            
            throw new RuntimeException("Could not parse JSON from Gemini response");
            
        } catch (Exception e) {
            log.error("Error parsing Gemini response", e);
            return MockInterviewGenerationResponse.builder()
                    .role(request.getRole())
                    .experience(request.getExperience())
                    .interviewType(request.getInterviewType())
                    .questions(new ArrayList<>())
                    .success(false)
                    .errorMessage("Failed to parse response: " + e.getMessage())
                    .build();
        }
    }
}