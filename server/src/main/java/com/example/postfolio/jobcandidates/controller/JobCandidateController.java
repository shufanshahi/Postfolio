package com.example.postfolio.jobcandidates.controller;

import com.example.postfolio.jobcandidates.dto.JobCandidateRequest;
import com.example.postfolio.jobcandidates.dto.JobCandidateResponse;
import com.example.postfolio.jobcandidates.dto.ActivateCandidatesRequest;
import com.example.postfolio.jobcandidates.dto.StatusUpdateRequest;
import com.example.postfolio.jobcandidates.service.JobCandidateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/job-candidates")
@RequiredArgsConstructor
@Slf4j
public class JobCandidateController {
    
    private final JobCandidateService jobCandidateService;

    @PostMapping
    public ResponseEntity<JobCandidateResponse> createJobCandidate(@RequestBody JobCandidateRequest request) {
        try {
            JobCandidateResponse response = jobCandidateService.createJobCandidate(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error creating job candidate", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<JobCandidateResponse>> getAllJobCandidates() {
        try {
            List<JobCandidateResponse> responses = jobCandidateService.getAllJobCandidates();
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("Error fetching all job candidates", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/job/{jobId}/activate")
    public ResponseEntity<List<JobCandidateResponse>> activateAllCandidatesForJob(
            @PathVariable Long jobId, 
            @RequestBody ActivateCandidatesRequest request) {
        try {
            List<JobCandidateResponse> responses = jobCandidateService.activateAllCandidatesForJob(
                jobId, request.getDesiredSelectNumber(), request.getExpireDate());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("Error activating candidates for job: " + jobId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/job/{jobId}/profile/{profileId}/status")
    public ResponseEntity<JobCandidateResponse> updateCandidateStatus(
            @PathVariable Long jobId,
            @PathVariable Long profileId, 
            @RequestBody StatusUpdateRequest request) {
        try {
            JobCandidateResponse response = jobCandidateService.updateCandidateStatus(jobId, profileId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error updating candidate status for job: " + jobId + " and profile: " + profileId, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error updating candidate status for job: " + jobId + " and profile: " + profileId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}