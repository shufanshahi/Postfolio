package com.example.postfolio.jobcandidates.service;

import com.example.postfolio.jobcandidates.dto.JobCandidateRequest;
import com.example.postfolio.jobcandidates.dto.JobCandidateResponse;
import com.example.postfolio.jobcandidates.dto.StatusUpdateRequest;

import java.util.List;

public interface JobCandidateService {
    JobCandidateResponse createJobCandidate(JobCandidateRequest request);
    List<JobCandidateResponse> getAllJobCandidates();
    List<JobCandidateResponse> activateAllCandidatesForJob(Long jobId, Integer desiredSelectNumber);
    JobCandidateResponse updateCandidateStatus(Long jobId, Long profileId, StatusUpdateRequest request);
}