package com.example.postfolio.interview.controller;

import com.example.postfolio.interview.dto.InterviewProgressRequest;
import com.example.postfolio.interview.dto.InterviewProgressResponse;
import com.example.postfolio.interview.service.InterviewProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interview-progress")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class InterviewProgressController {

    private final InterviewProgressService interviewProgressService;

    // Create new interview progress
    @PostMapping
    public ResponseEntity<InterviewProgressResponse> createInterviewProgress(@Valid @RequestBody InterviewProgressRequest request) {
        InterviewProgressResponse response = interviewProgressService.createInterviewProgress(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Get all interview progress
    @GetMapping
    public ResponseEntity<List<InterviewProgressResponse>> getAllInterviewProgress() {
        List<InterviewProgressResponse> progressList = interviewProgressService.getAllInterviewProgress();
        return new ResponseEntity<>(progressList, HttpStatus.OK);
    }

    // Get interview progress by profileId and mockInterviewId
    @GetMapping("/profile/{profileId}/mock-interview/{mockInterviewId}")
    public ResponseEntity<List<InterviewProgressResponse>> getInterviewProgressByProfileAndMockInterview(
            @PathVariable Long profileId, 
            @PathVariable Long mockInterviewId) {
        List<InterviewProgressResponse> progressList = 
            interviewProgressService.getInterviewProgressByProfileAndMockInterview(profileId, mockInterviewId);
        return new ResponseEntity<>(progressList, HttpStatus.OK);
    }
}
