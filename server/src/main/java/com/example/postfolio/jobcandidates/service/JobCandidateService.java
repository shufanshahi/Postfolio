package com.example.postfolio.jobcandidates.service;

import com.example.postfolio.jobcandidates.dto.JobCandidateRequest;
import com.example.postfolio.jobcandidates.dto.JobCandidateResponse;
import com.example.postfolio.jobcandidates.dto.StatusUpdateRequest;

import java.time.LocalDate;
import java.util.List;

public interface JobCandidateService {
    JobCandidateResponse createJobCandidate(JobCandidateRequest request);
    List<JobCandidateResponse> getAllJobCandidates();
    List<JobCandidateResponse> getProcessingCandidatesByProfileId(Long profileId);
    List<JobCandidateResponse> activateAllCandidatesForJob(Long jobId, Integer desiredSelectNumber, LocalDate expireDate);
    JobCandidateResponse updateCandidateStatus(Long jobId, Long profileId, StatusUpdateRequest request);
}