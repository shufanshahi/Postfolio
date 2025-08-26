package com.example.postfolio.interview.service;

import com.example.postfolio.interview.dto.MockInterviewRequest;
import com.example.postfolio.interview.dto.MockInterviewResponse;
import com.example.postfolio.interview.dto.MockInterviewStoreRequest;
import com.example.postfolio.interview.entity.MockInterview;
import com.example.postfolio.interview.repository.MockInterviewRepository;
import com.example.postfolio.tts.service.TtsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MockInterviewService {

    private final TtsService ttsService;
    private final MockInterviewRepository mockInterviewRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Value("${gemini.api.key:your-gemini-api-key}")
    private String geminiApiKey;
    
    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent}")
    private String geminiApiUrl;
    
    private static final String AUDIO_DIR = "src/main/resources/static/interview-audio/";

    public MockInterview storeMockInterview(MockInterviewStoreRequest request) {
        MockInterview mockInterview = new MockInterview();
        mockInterview.setProfileId(request.getProfileId());
        mockInterview.setRole(request.getRole());
        mockInterview.setExperience(request.getExperience());
        mockInterview.setInterviewType(request.getInterviewType());
        mockInterview.setNumQuestions(request.getNumQuestions());
        
        return mockInterviewRepository.save(mockInterview);
    }

    public MockInterviewResponse generateCustomInterview(MockInterviewRequest request) {
        try {
            // 1. Extract information from responses
            String role = extractRoleFromResponses(request.getResponses());
            String experience = extractExperienceFromResponses(request.getResponses());
            String interviewType = extractInterviewTypeFromResponses(request.getResponses());
            String numQuestions = extractNumQuestionsFromResponses(request.getResponses());
            
            // 2. Generate questions using Gemini
            MockInterviewResponse geminiResponse = generateQuestionsWithGemini(role, experience, interviewType, numQuestions);
            
            // 3. Convert questions to audio files
            List<String> audioUrls = generateAudioFiles(geminiResponse);
            geminiResponse.setAudioUrls(audioUrls);
            
            return geminiResponse;
            
        } catch (Exception e) {
            e.printStackTrace(); // Add logging
            throw new RuntimeException("Failed to generate custom interview: " + e.getMessage(), e);
        }
    }

    private String extractRoleFromResponses(List<MockInterviewRequest.InterviewResponse> responses) {
        return responses.stream()
                .filter(r -> "resgetRole".equals(r.getResponseKey()))
                .map(MockInterviewRequest.InterviewResponse::getTranscript)
                .findFirst()
                .orElse("Software Developer");
    }

    private String extractExperienceFromResponses(List<MockInterviewRequest.InterviewResponse> responses) {
        return responses.stream()
                .filter(r -> "resexperience".equals(r.getResponseKey()))
                .map(MockInterviewRequest.InterviewResponse::getTranscript)
                .findFirst()
                .orElse("2");
    }

    private String extractInterviewTypeFromResponses(List<MockInterviewRequest.InterviewResponse> responses) {
        return responses.stream()
                .filter(r -> "resinterviewType".equals(r.getResponseKey()))
                .map(MockInterviewRequest.InterviewResponse::getTranscript)
                .findFirst()
                .orElse("Technical");
    }

    private String extractNumQuestionsFromResponses(List<MockInterviewRequest.InterviewResponse> responses) {
        return responses.stream()
                .filter(r -> "resquestionNumber".equals(r.getResponseKey()))
                .map(MockInterviewRequest.InterviewResponse::getTranscript)
                .findFirst()
                .orElse("5");
    }

    private MockInterviewResponse generateQuestionsWithGemini(String role, String experience, String interviewType, String numQuestions) {
        try {
            String prompt = buildGeminiPrompt(role, experience, interviewType, numQuestions);
            
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
                                return objectMapper.readValue(jsonResponse, MockInterviewResponse.class);
                            }
                        }
                    }
                }
            }
            
            throw new RuntimeException("Failed to get valid response from Gemini API");
            
        } catch (Exception e) {
            throw new RuntimeException("Error calling Gemini API: " + e.getMessage(), e);
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

    private List<String> generateAudioFiles(MockInterviewResponse response) {
        List<String> audioUrls = new ArrayList<>();
        
        try {
            // Create audio directory if it doesn't exist
            Path audioDir = Paths.get(AUDIO_DIR);
            Files.createDirectories(audioDir);
            
            // Generate audio for introduction
            if (response.getIntroduction() != null && !response.getIntroduction().trim().isEmpty()) {
                String introFileName = "interview_intro_" + UUID.randomUUID().toString() + ".mp3";
                generateAudioFile(response.getIntroduction(), introFileName);
                audioUrls.add("/interview-audio/" + introFileName);
            }
            
            // Generate audio for each question
            if (response.getQuestions() != null) {
                for (MockInterviewResponse.Question question : response.getQuestions()) {
                    String questionFileName = "question_" + question.getId() + "_" + UUID.randomUUID().toString() + ".mp3";
                    generateAudioFile(question.getQuestion(), questionFileName);
                    audioUrls.add("/interview-audio/" + questionFileName);
                }
            }
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate audio files: " + e.getMessage(), e);
        }
        
        return audioUrls;
    }

    private void generateAudioFile(String text, String fileName) throws IOException, InterruptedException {
        Resource audioResource = ttsService.generateSpeech(text);
        
        // Save the resource to the audio directory
        Path outputPath = Paths.get(AUDIO_DIR, fileName);
        try (InputStream inputStream = audioResource.getInputStream();
             FileOutputStream outputStream = new FileOutputStream(outputPath.toFile())) {
            
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
        }
    }
}
