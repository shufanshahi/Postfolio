package com.example.postfolio.mcqGeneration.service;

import com.example.postfolio.mcqGeneration.dto.MCQGenerationRequest;
import com.example.postfolio.mcqGeneration.dto.MCQQuestionDTO;
import com.example.postfolio.mcqGeneration.dto.MCQSetResponse;
import com.example.postfolio.mcqGeneration.entity.MCQSet;
import com.example.postfolio.mcqGeneration.entity.MCQQuestion;
import com.example.postfolio.mcqGeneration.repository.MCQSetRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MCQService {

    @Autowired
    private MCQSetRepository mcqSetRepository;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MCQSetResponse generateMCQsFromDocument(MCQGenerationRequest request, Long userId) {
        try {
            // Call Gemini API to generate MCQs
            String prompt = createMCQPrompt(request.getDocumentContent());
            String geminiResponse = callGeminiAPI(prompt);

            // Parse the response to extract MCQs
            List<MCQQuestionDTO> mcqQuestions = parseMCQResponse(geminiResponse);

            // Save to database
            MCQSet mcqSet = new MCQSet(userId, request.getDocumentName());
            mcqSet = mcqSetRepository.save(mcqSet);

            List<MCQQuestion> questions = new ArrayList<>();
            for (MCQQuestionDTO dto : mcqQuestions) {
                MCQQuestion question = new MCQQuestion();
                question.setMcqSet(mcqSet);
                question.setQuestion(dto.getQuestion());
                question.setOptionA(dto.getOptionA());
                question.setOptionB(dto.getOptionB());
                question.setOptionC(dto.getOptionC());
                question.setOptionD(dto.getOptionD());
                question.setCorrectAnswer(dto.getCorrectAnswer());
                question.setExplanation(dto.getExplanation());
                questions.add(question);
            }

            mcqSet.setQuestions(questions);
            mcqSet = mcqSetRepository.save(mcqSet);

            // Convert to response DTO
            return convertToResponse(mcqSet);

        } catch (Exception e) {
            throw new RuntimeException("Error generating MCQs: " + e.getMessage());
        }
    }

    public List<MCQSetResponse> getUserMCQSets(Long userId) {
        List<MCQSet> mcqSets = mcqSetRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return mcqSets.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public MCQSetResponse getMCQSetById(Long id, Long userId) {
        MCQSet mcqSet = mcqSetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MCQ Set not found"));

        if (!mcqSet.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        return convertToResponse(mcqSet);
    }

    private String createMCQPrompt(String documentContent) {
        return String.format("""
            Based on the following document content, generate exactly 25 multiple choice questions (MCQs).
            
            Document Content:
            %s
            
            Please provide the response in JSON format with the following structure:
            {
              "questions": [
                {
                  "question": "Question text here",
                  "optionA": "Option A text",
                  "optionB": "Option B text", 
                  "optionC": "Option C text",
                  "optionD": "Option D text",
                  "correctAnswer": "A" (or B, C, D),
                  "explanation": "Brief explanation of why this is correct"
                }
              ]
            }
            
            Requirements:
            - Generate exactly 25 questions
            - Questions should cover different aspects of the document
            - Include a mix of difficulty levels (easy, medium, hard)
            - Ensure options are plausible but only one is correct
            - Provide clear explanations for correct answers
            - Make questions comprehensive and test understanding, not just memorization
            """, documentContent);
    }

    private String callGeminiAPI(String prompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> contents = new HashMap<>();
            Map<String, String> parts = new HashMap<>();
            parts.put("text", prompt);
            contents.put("parts", Arrays.asList(parts));
            requestBody.put("contents", Arrays.asList(contents));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            String url = geminiApiUrl + "?key=" + geminiApiKey;
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseNode = objectMapper.readTree(response.getBody());
                return responseNode.path("candidates").get(0)
                        .path("content").path("parts").get(0)
                        .path("text").asText();
            } else {
                throw new RuntimeException("Gemini API call failed: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Error calling Gemini API: " + e.getMessage());
        }
    }

    private List<MCQQuestionDTO> parseMCQResponse(String geminiResponse) {
        try {
            // Clean the response to extract JSON
            String jsonResponse = geminiResponse;
            if (jsonResponse.contains("```json")) {
                jsonResponse = jsonResponse.substring(jsonResponse.indexOf("```json") + 7);
                jsonResponse = jsonResponse.substring(0, jsonResponse.indexOf("```"));
            } else if (jsonResponse.contains("```")) {
                jsonResponse = jsonResponse.substring(jsonResponse.indexOf("```") + 3);
                jsonResponse = jsonResponse.substring(0, jsonResponse.lastIndexOf("```"));
            }

            JsonNode rootNode = objectMapper.readTree(jsonResponse);
            JsonNode questionsNode = rootNode.path("questions");

            List<MCQQuestionDTO> questions = new ArrayList<>();
            for (JsonNode questionNode : questionsNode) {
                MCQQuestionDTO dto = new MCQQuestionDTO();
                dto.setQuestion(questionNode.path("question").asText());
                dto.setOptionA(questionNode.path("optionA").asText());
                dto.setOptionB(questionNode.path("optionB").asText());
                dto.setOptionC(questionNode.path("optionC").asText());
                dto.setOptionD(questionNode.path("optionD").asText());
                dto.setCorrectAnswer(questionNode.path("correctAnswer").asText());
                dto.setExplanation(questionNode.path("explanation").asText());
                questions.add(dto);
            }

            // Ensure we have exactly 25 questions
            if (questions.size() > 25) {
                questions = questions.subList(0, 25);
            }

            return questions;
        } catch (Exception e) {
            throw new RuntimeException("Error parsing MCQ response: " + e.getMessage());
        }
    }

    private MCQSetResponse convertToResponse(MCQSet mcqSet) {
        MCQSetResponse response = new MCQSetResponse();
        response.setId(mcqSet.getId());
        response.setDocumentName(mcqSet.getDocumentName());
        response.setCreatedAt(mcqSet.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        List<MCQQuestionDTO> questionDTOs = mcqSet.getQuestions().stream()
                .map(q -> {
                    MCQQuestionDTO dto = new MCQQuestionDTO();
                    dto.setId(q.getId());
                    dto.setQuestion(q.getQuestion());
                    dto.setOptionA(q.getOptionA());
                    dto.setOptionB(q.getOptionB());
                    dto.setOptionC(q.getOptionC());
                    dto.setOptionD(q.getOptionD());
                    dto.setCorrectAnswer(q.getCorrectAnswer());
                    dto.setExplanation(q.getExplanation());
                    return dto;
                })
                .collect(Collectors.toList());

        response.setQuestions(questionDTOs);
        return response;
    }
}