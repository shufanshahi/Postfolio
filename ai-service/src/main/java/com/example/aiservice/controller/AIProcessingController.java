package com.example.aiservice.controller;

import com.example.aiservice.dto.*;
import com.example.aiservice.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AIProcessingController {

    private final PostAIService postAIService;
    private final JobMatchingAIService jobMatchingAIService;
    private final MCQGenerationAIService mcqGenerationAIService;
    private final InterviewGenerationAIService interviewGenerationAIService;
    private final MockInterviewGenerationAIService mockInterviewGenerationAIService;
    private final InterviewEvaluationAIService interviewEvaluationAIService;
    private final NewsSummarizationAIService newsSummarizationAIService;

    @PostMapping("/process-post")
    public ResponseEntity<PostProcessingResponse> processPost(@RequestBody PostProcessingRequest request) {
        log.info("Processing post with AI: {}", request.getPostId());
        PostProcessingResponse response = postAIService.processPost(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/process-post-async")
    public ResponseEntity<String> processPostAsync(@RequestBody PostProcessingRequest request) {
        log.info("Starting async processing for post: {}", request.getPostId());
        postAIService.processPostAsync(request);
        return ResponseEntity.ok("Post processing started");
    }

    @PostMapping("/match-job")
    public ResponseEntity<JobMatchingResponse> matchJob(@RequestBody JobMatchingRequest request) {
        log.info("Matching job {} for profile {}", request.getJobId(), request.getProfileId());
        log.info("DEBUG: Received jobEducation field: '{}'", request.getJobEducation());
        JobMatchingResponse response = jobMatchingAIService.matchJob(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/generate-mcq")
    public ResponseEntity<MCQGenerationResponse> generateMCQ(@RequestBody MCQGenerationRequest request) {
        log.info("Generating MCQ for user {} on topic: {}", request.getUserId(), request.getTopic());
        MCQGenerationResponse response = mcqGenerationAIService.generateMCQ(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/generate-mcq-async")
    public ResponseEntity<String> generateMCQAsync(@RequestBody MCQGenerationRequest request) {
        log.info("Starting async MCQ generation for user {} on topic: {}",
                request.getUserId(), request.getTopic());
        mcqGenerationAIService.generateMCQAsync(request);
        return ResponseEntity.ok("MCQ generation started");
    }

    @PostMapping("/generate-interview")
    public ResponseEntity<InterviewGenerationResponse> generateInterview(
            @RequestBody InterviewGenerationRequest request) {
        log.info("Generating interview questions for user {} for role: {}",
                request.getUserId(), request.getJobRole());
        InterviewGenerationResponse response = interviewGenerationAIService.generateInterview(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/generate-interview-async")
    public ResponseEntity<String> generateInterviewAsync(@RequestBody InterviewGenerationRequest request) {
        log.info("Starting async interview generation for user {} for role: {}",
                request.getUserId(), request.getJobRole());
        interviewGenerationAIService.generateInterviewAsync(request);
        return ResponseEntity.ok("Interview generation started");
    }

    @PostMapping("/generate-custom-interview")
    public ResponseEntity<MockInterviewGenerationResponse> generateCustomInterview(
            @RequestBody MockInterviewGenerationRequest request) {
        log.info("Generating custom interview for role: {}, experience: {}, type: {}, questions: {}", 
                request.getRole(), request.getExperience(), request.getInterviewType(), request.getNumQuestions());
        MockInterviewGenerationResponse response = mockInterviewGenerationAIService.generateCustomInterview(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/evaluate-interview")
    public ResponseEntity<InterviewEvaluationResponse> evaluateInterview(
            @RequestBody InterviewEvaluationRequest request) {
        log.info("Evaluating interview with {} Q&A pairs", request.getQuestionAnswers().size());
        InterviewEvaluationResponse response = interviewEvaluationAIService.evaluateInterview(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/summarize-news")
    public ResponseEntity<NewsSummarizationResponse> summarizeNews(@RequestBody NewsSummarizationRequest request) {
        log.info("Summarizing news content with target audience: {}", request.getTargetAudience());
        NewsSummarizationResponse response = newsSummarizationAIService.summarizeNews(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("AI Service is running");
    }
}
