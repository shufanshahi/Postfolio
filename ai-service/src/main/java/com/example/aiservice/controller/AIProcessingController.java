package com.example.aiservice.controller;

import com.example.aiservice.dto.*;
import com.example.aiservice.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AIProcessingController {

    @Value("${server.port:8081}")
    private String serverPort;

    private final PostAIService postAIService;
    private final JobMatchingAIService jobMatchingAIService;
    private final MCQGenerationAIService mcqGenerationAIService;
    private final InterviewGenerationAIService interviewGenerationAIService;
    private final MockInterviewGenerationAIService mockInterviewGenerationAIService;
    private final InterviewEvaluationAIService interviewEvaluationAIService;
    private final NewsSummarizationAIService newsSummarizationAIService;
    private final RoadmapGenerationAIService roadmapGenerationAIService;
    private final DocumentSummarizationAIService documentSummarizationAIService;

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

    @PostMapping("/generate-roadmap")
    public ResponseEntity<RoadmapGenerationResponse> generateRoadmap(@RequestBody RoadmapGenerationRequest request) {
        log.info("Generating AI-powered roadmap for job {} and profile {}",
                request.getJobId(), request.getProfileId());
        RoadmapGenerationResponse response = roadmapGenerationAIService.generateRoadmap(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/summarize")
    public ResponseEntity<String> summarizeDocument(@RequestBody DocumentSummarizationRequest request) {
        log.info("Summarizing document content with {} characters", request.getDocumentContent().length());
        String summary = documentSummarizationAIService.summarizeDocument(request);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("AI Service is running");
    }

    @GetMapping("/instance")
    public ResponseEntity<Map<String, Object>> getInstanceInfo() {
        Map<String, Object> response = new HashMap<>();

        try {
            InetAddress inetAddress = InetAddress.getLocalHost();

            response.put("service", "ai-service");
            response.put("port", serverPort);
            response.put("hostname", inetAddress.getHostName());
            response.put("ipAddress", inetAddress.getHostAddress());
            response.put("timestamp", LocalDateTime.now().toString());
            response.put("status", "UP");

            // Add JVM info for more detail
            Runtime runtime = Runtime.getRuntime();
            Map<String, Object> jvmInfo = new HashMap<>();
            jvmInfo.put("totalMemory", runtime.totalMemory());
            jvmInfo.put("freeMemory", runtime.freeMemory());
            jvmInfo.put("maxMemory", runtime.maxMemory());
            response.put("jvmInfo", jvmInfo);

            log.info("AI Service health check called on instance - Port: {}, Hostname: {}",
                    serverPort, inetAddress.getHostName());

        } catch (UnknownHostException e) {
            log.error("Error getting host information", e);
            response.put("service", "ai-service");
            response.put("port", serverPort);
            response.put("hostname", "unknown");
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now().toString());
            response.put("status", "ERROR");
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/load-test")
    public ResponseEntity<Map<String, Object>> loadTest() {
        Map<String, Object> response = new HashMap<>();

        try {
            // Simulate some processing time
            Thread.sleep(50);

            response.put("service", "ai-service");
            response.put("port", serverPort);
            response.put("hostname", InetAddress.getLocalHost().getHostName());
            response.put("requestId", System.nanoTime());
            response.put("timestamp", LocalDateTime.now().toString());
            response.put("message", "AI Service load balancing test successful");

            log.info("AI Service load test endpoint called on port: {}", serverPort);

        } catch (Exception e) {
            log.error("Error in AI load test", e);
            response.put("error", e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}
