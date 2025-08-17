package com.example.postfolio.interview.controller;

import com.example.postfolio.interview.dto.InterviewRequest;
import com.example.postfolio.interview.dto.InterviewResponse;
import com.example.postfolio.interview.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interviews")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class InterviewController {
    private final InterviewService interviewService;

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

    // Update interview status based on profileId and jobId
    @PutMapping("/update-status")
    public String updateInterviewStatus(@RequestParam Long profileId, @RequestParam Long jobId, @RequestParam String status) {
        return interviewService.updateInterviewStatus(profileId, jobId, status);
    }
}
