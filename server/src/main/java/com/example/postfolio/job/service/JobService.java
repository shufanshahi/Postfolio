package com.example.postfolio.job.service;

import com.example.postfolio.job.dto.JobRequest;
import com.example.postfolio.job.dto.JobResponse;
import java.util.List;

public interface JobService {
    JobResponse createJob(JobRequest request);
    JobResponse updateJob(Long jobId, JobRequest request);
    void deleteJob(Long jobId);
    JobResponse getJobById(Long jobId);
    List<JobResponse> getAllJobs();
    JobResponse applyToJob(Long jobId, Long applicantId);
    JobResponse selectApplicant(Long jobId, Long applicantId);
}
