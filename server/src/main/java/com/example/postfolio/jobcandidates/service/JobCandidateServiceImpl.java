package com.example.postfolio.jobcandidates.service;

import com.example.postfolio.jobcandidates.dto.JobCandidateRequest;
import com.example.postfolio.jobcandidates.dto.JobCandidateResponse;
import com.example.postfolio.jobcandidates.entity.JobCandidate;
import com.example.postfolio.jobcandidates.model.CandidateStatus;
import com.example.postfolio.jobcandidates.repository.JobCandidateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class JobCandidateServiceImpl implements JobCandidateService {
    
    private final JobCandidateRepository jobCandidateRepository;

    @Override
    public JobCandidateResponse createJobCandidate(JobCandidateRequest request) {
        JobCandidate jobCandidate = JobCandidate.builder()
                .jobId(request.getJobId())
                .profileId(request.getProfileId())
                .status(CandidateStatus.OFF) // Default status
                .score(request.getScore())
                .expireDate(null) // Default empty expire date
                .build();
        
        JobCandidate savedJobCandidate = jobCandidateRepository.save(jobCandidate);
        return mapToResponse(savedJobCandidate);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobCandidateResponse> getAllJobCandidates() {
        return jobCandidateRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<JobCandidateResponse> activateAllCandidatesForJob(Long jobId) {
        // Find all candidates for the specific job
        List<JobCandidate> candidates = jobCandidateRepository.findByJobId(jobId);
        
        // Update status to ON for all candidates
        candidates.forEach(candidate -> candidate.setStatus(CandidateStatus.ON));
        
        // Save all updated candidates
        List<JobCandidate> updatedCandidates = jobCandidateRepository.saveAll(candidates);
        
        // Return the updated candidates as responses
        return updatedCandidates.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private JobCandidateResponse mapToResponse(JobCandidate jobCandidate) {
        JobCandidateResponse response = new JobCandidateResponse();
        response.setId(jobCandidate.getId());
        response.setJobId(jobCandidate.getJobId());
        response.setProfileId(jobCandidate.getProfileId());
        response.setStatus(jobCandidate.getStatus());
        response.setScore(jobCandidate.getScore());
        response.setExpireDate(jobCandidate.getExpireDate());
        return response;
    }
}