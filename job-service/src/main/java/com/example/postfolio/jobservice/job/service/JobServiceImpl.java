package com.example.postfolio.jobservice.job.service;

import com.example.postfolio.jobservice.job.dto.JobRequest;
import com.example.postfolio.jobservice.job.dto.JobResponse;
import com.example.postfolio.jobservice.job.entity.Job;
import com.example.postfolio.jobservice.job.model.JobStatus;
import com.example.postfolio.jobservice.job.repository.JobRepository;
import com.example.postfolio.jobservice.user.entity.User;
import com.example.postfolio.jobservice.user.repository.UserRepository;
import com.example.postfolio.jobservice.profile.entity.Profile;
import com.example.postfolio.jobservice.profile.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobServiceImpl implements JobService {
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;

    @Override
    public List<JobResponse> getJobsByEmployer(Long employerId) {
        return jobRepository.findAll().stream()
            .filter(job -> job.getEmployer() != null && job.getEmployer().getId().equals(employerId))
            .map(this::toResponse)
            .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public JobResponse createJob(JobRequest request) {
        User employer = userRepository.findById(request.getEmployerId()).orElseThrow();
        Job job = Job.builder()
            .title(request.getTitle())
            .position(request.getPosition())
            .description(request.getDescription())
            .datePosted(request.getDatePosted())
            .endDate(request.getEndDate())
            .requirements(request.getRequirements())
            .status(JobStatus.OPEN)
            .employer(employer)
            .build();
        jobRepository.save(job);
        return toResponse(job);
    }

    @Override
    public List<JobResponse> getAllJobs() {
        return jobRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public JobResponse applyForJob(Long jobId, Long applicantId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> 
            new RuntimeException("Job not found with id: " + jobId));
        
        Profile applicant = profileRepository.findById(applicantId).orElseThrow(() -> 
            new RuntimeException("Profile not found with id: " + applicantId));
        
        // Check if the profile is already an applicant
        if (!job.getApplicants().contains(applicant)) {
            job.getApplicants().add(applicant);
            jobRepository.save(job);
        }
        
        return toResponse(job);
    }

    @Override
    public JobResponse getJobById(Long jobId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> 
            new RuntimeException("Job not found with id: " + jobId));
        
        return toResponse(job);
    }

    private JobResponse toResponse(Job job) {
        JobResponse res = new JobResponse();
        res.setJobId(job.getJobId());
        res.setTitle(job.getTitle());
        res.setPosition(job.getPosition());
        res.setDescription(job.getDescription());
        res.setDatePosted(job.getDatePosted());
        res.setEndDate(job.getEndDate());
        res.setRequirements(job.getRequirements());
        res.setStatus(job.getStatus());
        res.setEmployerId(job.getEmployer() != null ? job.getEmployer().getId() : null);
        res.setApplicantIds(job.getApplicants().stream().map(Profile::getId).collect(Collectors.toList()));
        res.setSelectedApplicantIds(job.getSelectedApplicants().stream().map(Profile::getId).collect(Collectors.toList()));
        return res;
    }
} 