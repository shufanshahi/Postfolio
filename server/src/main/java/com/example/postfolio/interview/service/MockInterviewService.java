package com.example.postfolio.interview.service;

import com.example.postfolio.aiservice.dto.MockInterviewGenerationRequest;
import com.example.postfolio.aiservice.dto.MockInterviewGenerationResponse;
import com.example.postfolio.aiservice.service.AIServiceManager;
import com.example.postfolio.interview.dto.MockInterviewRequest;
import com.example.postfolio.interview.dto.MockInterviewResponse;
import com.example.postfolio.interview.dto.MockInterviewStoreRequest;
import com.example.postfolio.interview.entity.MockInterview;
import com.example.postfolio.interview.repository.MockInterviewRepository;
import com.example.postfolio.tts.service.TtsService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MockInterviewService {

    private final TtsService ttsService;
    private final MockInterviewRepository mockInterviewRepository;
    private final AIServiceManager aiServiceManager;
    
    private static final String AUDIO_DIR = "src/main/resources/static/interview-audio/";

    public MockInterview getMockInterviewById(Long id) {
        return mockInterviewRepository.findById(id).orElse(null);
    }

    public MockInterview storeMockInterview(MockInterviewStoreRequest request) {
        MockInterview mockInterview = new MockInterview();
        mockInterview.setProfileId(request.getProfileId());
        mockInterview.setRole(request.getRole());
        mockInterview.setExperience(request.getExperience());
        mockInterview.setInterviewType(request.getInterviewType());
        mockInterview.setNumQuestions(request.getNumQuestions());
        
        return mockInterviewRepository.save(mockInterview);
    }

    public List<MockInterview> getMockInterviewsByProfileId(Long profileId) {
        return mockInterviewRepository.findByProfileId(profileId);
    }

    public MockInterviewResponse generateCustomInterview(MockInterviewRequest request) {
        try {
            // 1. Extract information from responses
            String role = extractRoleFromResponses(request.getResponses());
            String experience = extractExperienceFromResponses(request.getResponses());
            String interviewType = extractInterviewTypeFromResponses(request.getResponses());
            String numQuestions = extractNumQuestionsFromResponses(request.getResponses());
            
            // 2. Generate questions using AI Service
            MockInterviewResponse geminiResponse = generateQuestionsWithAIService(role, experience, interviewType, numQuestions);
            
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

    private MockInterviewResponse generateQuestionsWithAIService(String role, String experience, String interviewType, String numQuestions) {
        try {
            // Create request for AI service
            MockInterviewGenerationRequest request = MockInterviewGenerationRequest.builder()
                    .role(role)
                    .experience(experience)
                    .interviewType(interviewType)
                    .numQuestions(numQuestions)
                    .build();
            
            // Call AI service
            MockInterviewGenerationResponse aiResponse = aiServiceManager.generateCustomInterview(request);
            
            if (!aiResponse.isSuccess()) {
                throw new RuntimeException("AI service failed: " + aiResponse.getErrorMessage());
            }
            
            // Convert AI service response to MockInterviewResponse
            MockInterviewResponse response = new MockInterviewResponse();
            response.setIntroduction(aiResponse.getIntroduction());
            response.setRole(aiResponse.getRole());
            response.setExperience(aiResponse.getExperience());
            response.setInterviewType(aiResponse.getInterviewType());
            
            // Convert questions
            if (aiResponse.getQuestions() != null) {
                List<MockInterviewResponse.Question> questions = new ArrayList<>();
                for (MockInterviewGenerationResponse.Question aiQuestion : aiResponse.getQuestions()) {
                    MockInterviewResponse.Question question = new MockInterviewResponse.Question();
                    question.setId(aiQuestion.getId());
                    question.setQuestion(aiQuestion.getQuestion());
                    questions.add(question);
                }
                response.setQuestions(questions);
            }
            
            return response;
            
        } catch (Exception e) {
            throw new RuntimeException("Error calling AI service: " + e.getMessage(), e);
        }
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
