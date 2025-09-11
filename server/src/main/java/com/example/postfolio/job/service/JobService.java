package com.example.postfolio.job.service;

import com.example.postfolio.job.dto.AutoSelectRequest;
import com.example.postfolio.job.dto.JobRequest;
import com.example.postfolio.job.dto.JobResponse;
import com.example.postfolio.job.entity.Job;
import com.example.postfolio.job.model.JobStatus;

import java.util.List;

public interface JobService {
    JobResponse createJob(JobRequest request);
    List<JobResponse> getAllJobs();
    List<JobResponse> getJobsByEmployer(Long employerId);
    JobResponse applyForJob(Long jobId, Long applicantId);
    JobResponse getJobById(Long jobId);
    JobResponse getJobDetails(Long jobId);
    JobResponse withdrawApplication(Long jobId, Long applicantId);
    void deleteJob(Long jobId);
    JobResponse updateJobStatus(Long jobId, JobStatus status);
    JobResponse rejectApplicant(Long jobId, Long applicantId);
    JobResponse selectApplicant(Long jobId, Long applicantId);

    // Auto-select method
    JobResponse startAutoSelect(Long jobId, AutoSelectRequest request);

    // Additional methods to support matching
    List<Job> findAllActiveJobs();
    Job findById(Long jobId);
}
