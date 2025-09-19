package com.example.postfolio.interview.controller;

import com.example.postfolio.interview.dto.InterviewRequest;
import com.example.postfolio.interview.dto.InterviewResponse;
import com.example.postfolio.interview.dto.MockInterviewRequest;
import com.example.postfolio.interview.dto.MockInterviewResponse;
import com.example.postfolio.interview.dto.MockInterviewStoreRequest;
import com.example.postfolio.interview.dto.EvaluationRequest;
import com.example.postfolio.interview.dto.EvaluationResponse;
import com.example.postfolio.interview.entity.MockInterview;
import com.example.postfolio.interview.service.InterviewService;
import com.example.postfolio.interview.service.MockInterviewService;
import com.example.postfolio.interview.service.EvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
public class InterviewController {
    private final InterviewService interviewService;
    private final MockInterviewService mockInterviewService;
    private final EvaluationService evaluationService;

    // Schedule interview with all details
    @PostMapping("/schedule")
    public String scheduleInterview(@RequestBody InterviewRequest request) {
        return interviewService.scheduleInterview(request);
    }
    
    // Get all interviews for a specific profile
    @GetMapping("/profile/{profileId}")
    public List<InterviewResponse> getInterviewsByProfile(@PathVariable Long profileId) {
        return interviewService.getInterviewsByProfile(profileId);
    }

    // Get interview by profileId and jobId
    @GetMapping("/profile/{profileId}/job/{jobId}")
    public InterviewResponse getInterviewByProfileAndJob(@PathVariable Long profileId, @PathVariable Long jobId) {
        return interviewService.getInterviewByProfileAndJob(profileId, jobId);
    }

    // Get interview by interview ID
    @GetMapping("/{interviewId}")
    public InterviewResponse getInterviewById(@PathVariable Long interviewId) {
        return interviewService.getInterviewById(interviewId);
    }

    // Update interview status based on profileId and jobId
    @PutMapping("/update-status")
    public String updateInterviewStatus(@RequestParam Long profileId, @RequestParam Long jobId, @RequestParam String status) {
        return interviewService.updateInterviewStatus(profileId, jobId, status);
    }

    // Generate custom interview questions based on mock interview responses
    @PostMapping("/generate-custom")
    public MockInterviewResponse generateCustomInterview(@RequestBody MockInterviewRequest request) {
        return mockInterviewService.generateCustomInterview(request);
    }

    // Store mock interview information
    @PostMapping("/store-mock-interview")
    public MockInterview storeMockInterview(@RequestBody MockInterviewStoreRequest request) {
        return mockInterviewService.storeMockInterview(request);
    }


    // Get mock interviews by profile ID
    @GetMapping("/mock-interviews/{profileId}")
    public List<MockInterview> getMockInterviewsByProfileId(@PathVariable Long profileId) {
        return mockInterviewService.getMockInterviewsByProfileId(profileId);
    }

    // Get a single mock interview by its ID
    @GetMapping("/mock-interview/{id}")
    public MockInterview getMockInterviewById(@PathVariable Long id) {
        return mockInterviewService.getMockInterviewById(id);
    }

    // Evaluate interview performance based on questions and answers
    @PostMapping("/evaluate")
    public EvaluationResponse evaluateInterview(@RequestBody EvaluationRequest request) {
        return evaluationService.evaluateInterview(request);
    }

    // Test endpoint to check authentication
    @GetMapping("/test-auth")
    public ResponseEntity<String> testAuth() {
        return ResponseEntity.ok("Authentication successful!");
    }

    // Test endpoint for custom interview generation
    @GetMapping("/test-custom")
    public String testCustomInterview() {
        return "Custom interview service is running!";
    }
}
