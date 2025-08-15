package com.example.postfolio.jobservice.job.service;

import com.example.postfolio.jobservice.job.dto.JobRequest;
import com.example.postfolio.jobservice.job.dto.JobResponse;
import java.util.List;

public interface JobService {
    JobResponse createJob(JobRequest request);
    List<JobResponse> getAllJobs();
    List<JobResponse> getJobsByEmployer(Long employerId);
    JobResponse applyForJob(Long jobId, Long applicantId);
    JobResponse getJobById(Long jobId);
} 