package com.example.postfolio.jobcandidates.service;

import com.example.postfolio.jobcandidates.dto.JobCandidateRequest;
import com.example.postfolio.jobcandidates.dto.JobCandidateResponse;
import com.example.postfolio.jobcandidates.entity.JobCandidate;
import com.example.postfolio.jobcandidates.model.CandidateStatus;
import com.example.postfolio.jobcandidates.repository.JobCandidateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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
    public List<JobCandidateResponse> activateAllCandidatesForJob(Long jobId, Integer desiredSelectNumber) {
        // Find all candidates for the specific job
        List<JobCandidate> candidates = jobCandidateRepository.findByJobId(jobId);
        
        if (candidates.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Sort candidates by score in descending order (highest scores first)
        // Handle null scores by treating them as 0.0
        candidates.sort((c1, c2) -> {
            Double score1 = c1.getScore() != null ? c1.getScore() : 0.0;
            Double score2 = c2.getScore() != null ? c2.getScore() : 0.0;
            return Double.compare(score2, score1); // Descending order
        });
        
        // Handle corner case: if desiredSelectNumber is null or candidates are fewer than desired
        int numberOfCandidatesToProcess = desiredSelectNumber != null ? 
            Math.min(desiredSelectNumber, candidates.size()) : candidates.size();
        
        // Set status for candidates
        for (int i = 0; i < candidates.size(); i++) {
            JobCandidate candidate = candidates.get(i);
            if (i < numberOfCandidatesToProcess) {
                // Top candidates (highest scores) set to PROCESSING
                candidate.setStatus(CandidateStatus.PROCESSING);
            } else {
                // Remaining candidates set to ON
                candidate.setStatus(CandidateStatus.ON);
            }
        }
        
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