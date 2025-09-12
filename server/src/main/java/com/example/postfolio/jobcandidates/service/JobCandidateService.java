package com.example.postfolio.jobcandidates.service;

import com.example.postfolio.jobcandidates.dto.JobCandidateRequest;
import com.example.postfolio.jobcandidates.dto.JobCandidateResponse;

import java.util.List;

public interface JobCandidateService {
    JobCandidateResponse createJobCandidate(JobCandidateRequest request);
    List<JobCandidateResponse> getAllJobCandidates();
    List<JobCandidateResponse> activateAllCandidatesForJob(Long jobId);
}