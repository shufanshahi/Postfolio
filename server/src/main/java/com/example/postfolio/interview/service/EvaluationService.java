package com.example.postfolio.interview.service;

import com.example.postfolio.interview.dto.EvaluationRequest;
import com.example.postfolio.interview.dto.EvaluationResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key:your-gemini-api-key}")
    private String geminiApiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent}")
    private String geminiApiUrl;

    public EvaluationResponse evaluateInterview(EvaluationRequest request) {
        try {
            String prompt = buildEvaluationPrompt(request);
            
            // Prepare request body for Gemini API
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> contents = new HashMap<>();
            Map<String, Object> requestParts = new HashMap<>();
            requestParts.put("text", prompt);
            contents.put("parts", Arrays.asList(requestParts));
            requestBody.put("contents", Arrays.asList(contents));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            String url = geminiApiUrl + "?key=" + geminiApiKey;
            
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                // Extract the generated text from Gemini response
                @SuppressWarnings("unchecked")
                Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
                if (responseBody != null) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
                    if (candidates != null && !candidates.isEmpty()) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            String generatedText = (String) parts.get(0).get("text");
                            
                            // Parse JSON response from Gemini
                            int jsonStart = generatedText.indexOf("{");
                            int jsonEnd = generatedText.lastIndexOf("}") + 1;
                            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                                String jsonResponse = generatedText.substring(jsonStart, jsonEnd);
                                return objectMapper.readValue(jsonResponse, EvaluationResponse.class);
                            }
                        }
                    }
                }
            }
            
            throw new RuntimeException("Failed to get valid response from Gemini API");
            
        } catch (Exception e) {
            throw new RuntimeException("Error calling Gemini API for evaluation: " + e.getMessage(), e);
        }
    }

    private String buildEvaluationPrompt(EvaluationRequest request) {
        StringBuilder interviewQA = new StringBuilder();
        
        for (int i = 0; i < request.getQuestionAnswers().size(); i++) {
            EvaluationRequest.QuestionAnswer qa = request.getQuestionAnswers().get(i);
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
}
