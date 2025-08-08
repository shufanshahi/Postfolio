package com.example.postfolio.job.controller;

import com.example.postfolio.job.dto.JobRequest;
import com.example.postfolio.job.dto.JobResponse;
import com.example.postfolio.job.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {
    private final JobService jobService;

    @PostMapping
    public ResponseEntity<JobResponse> createJob(@RequestBody JobRequest request) {
        return ResponseEntity.ok(jobService.createJob(request));
    }

    @PutMapping("/{jobId}")
    public ResponseEntity<JobResponse> updateJob(@PathVariable Long jobId, @RequestBody JobRequest request) {
        return ResponseEntity.ok(jobService.updateJob(jobId, request));
    }

    @DeleteMapping("/{jobId}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long jobId) {
        jobService.deleteJob(jobId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<JobResponse> getJobById(@PathVariable Long jobId) {
        return ResponseEntity.ok(jobService.getJobById(jobId));
    }

    @GetMapping
    public ResponseEntity<List<JobResponse>> getAllJobs() {
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    @PostMapping("/{jobId}/apply/{applicantId}")
    public ResponseEntity<JobResponse> applyToJob(@PathVariable Long jobId, @PathVariable Long applicantId) {
        return ResponseEntity.ok(jobService.applyToJob(jobId, applicantId));
    }

    @PostMapping("/{jobId}/select/{applicantId}")
    public ResponseEntity<JobResponse> selectApplicant(@PathVariable Long jobId, @PathVariable Long applicantId) {
        return ResponseEntity.ok(jobService.selectApplicant(jobId, applicantId));
    }
}
