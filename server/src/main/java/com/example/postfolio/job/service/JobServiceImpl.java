 
package com.example.postfolio.job.service;

import com.example.postfolio.job.dto.JobRequest;
import com.example.postfolio.job.dto.JobResponse;
import com.example.postfolio.job.entity.Job;
import com.example.postfolio.job.model.JobStatus;
import com.example.postfolio.job.repository.JobRepository;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.repository.UserRepository;
import com.example.postfolio.profile.entity.Profile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobServiceImpl implements JobService {
    private final JobRepository jobRepository;
    private final UserRepository userRepository;

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
