package com.example.postfolio.job.service;

import com.example.postfolio.job.dto.JobRequest;
import com.example.postfolio.job.dto.JobResponse;
import java.util.List;

public interface JobService {
    JobResponse createJob(JobRequest request);
    List<JobResponse> getAllJobs();
    List<JobResponse> getJobsByEmployer(Long employerId);
    JobResponse applyForJob(Long jobId, Long applicantId);
}
