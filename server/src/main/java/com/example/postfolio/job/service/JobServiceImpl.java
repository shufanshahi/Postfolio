package com.example.postfolio.job.service;

import com.example.postfolio.job.dto.JobRequest;
import com.example.postfolio.job.dto.JobResponse;
import com.example.postfolio.job.entity.Job;
import com.example.postfolio.job.model.JobStatus;
import com.example.postfolio.job.repository.JobRepository;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.repository.UserRepository;
import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.repository.ProfileRepository;
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
        .requiredProject(request.getRequiredProject())
        .requiredSkills(request.getRequiredSkills())
        .requiredEducation(request.getRequiredEducation())
        .requiredExperience(request.getRequiredExperience())
        .status(JobStatus.OPEN)
        .employer(employer)
        .maxSalary(request.getMaxSalary())
        .minSalary(request.getMinSalary())
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
    public JobResponse withdrawApplication(Long jobId, Long applicantId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() ->
                new RuntimeException("Job not found with id: " + jobId));

        Profile applicant = profileRepository.findById(applicantId).orElseThrow(() ->
                new RuntimeException("Profile not found with id: " + applicantId));

        // Remove the applicant from the job's applicants list
        if (job.getApplicants().contains(applicant)) {
            job.getApplicants().remove(applicant);
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

    @Override
    public void deleteJob(Long jobId) {
        Job job = jobRepository.findById(jobId).orElseThrow(() ->
                new RuntimeException("Job not found with id: " + jobId));
        jobRepository.delete(job);
    }

    @Override
    public JobResponse updateJobStatus(Long jobId, JobStatus status) {
        Job job = jobRepository.findById(jobId).orElseThrow(() ->
                new RuntimeException("Job not found with id: " + jobId));
        job.setStatus(status);
        jobRepository.save(job);
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
        res.setRequiredProject(job.getRequiredProject());
        res.setRequiredSkills(job.getRequiredSkills());
        res.setRequiredEducation(job.getRequiredEducation());
        res.setRequiredExperience(job.getRequiredExperience());
        res.setStatus(job.getStatus());
        res.setEmployerId(job.getEmployer() != null ? job.getEmployer().getId() : null);
        res.setMinSalary(job.getMinSalary());
        res.setMaxSalary(job.getMaxSalary());
        res.setApplicantIds(job.getApplicants().stream().map(Profile::getId).collect(Collectors.toList()));
        res.setRejectedApplicantIds(job.getRejectedApplicants().stream().map(Profile::getId).collect(Collectors.toList()));
        res.setSelectedApplicantIds(job.getSelectedApplicants().stream().map(Profile::getId).collect(Collectors.toList()));
        return res;
    }
}