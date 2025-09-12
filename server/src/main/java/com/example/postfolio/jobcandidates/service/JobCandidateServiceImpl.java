package com.example.postfolio.jobcandidates.service;

import com.example.postfolio.jobcandidates.dto.JobCandidateRequest;
import com.example.postfolio.jobcandidates.dto.JobCandidateResponse;
import com.example.postfolio.jobcandidates.dto.StatusUpdateRequest;
import com.example.postfolio.jobcandidates.entity.JobCandidate;
import com.example.postfolio.jobcandidates.model.CandidateStatus;
import com.example.postfolio.jobcandidates.repository.JobCandidateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
    @Transactional(readOnly = true)
    public List<JobCandidateResponse> getActiveCandidatesByProfileId(Long profileId) {
        // Define the statuses we want to include: PROCESSING, ACCEPTED, REJECTED
        List<CandidateStatus> activeStatuses = List.of(
            CandidateStatus.PROCESSING,
            CandidateStatus.ACCEPTED,
            CandidateStatus.REJECTED
        );
        
        return jobCandidateRepository.findByProfileIdAndStatusIn(profileId, activeStatuses)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<JobCandidateResponse> activateAllCandidatesForJob(Long jobId, Integer desiredSelectNumber, LocalDate expireDate) {
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
                // Set expire date for PROCESSING candidates
                if (expireDate != null) {
                    candidate.setExpireDate(expireDate);
                }
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

    @Override
    public JobCandidateResponse updateCandidateStatus(Long jobId, Long profileId, StatusUpdateRequest request) {
        // Find the candidate to update by jobId and profileId
        JobCandidate candidate = jobCandidateRepository.findByJobIdAndProfileId(jobId, profileId)
                .orElseThrow(() -> new RuntimeException("Job candidate not found for job: " + jobId + " and profile: " + profileId));
        
        // Update the candidate status
        candidate.setStatus(request.getStatus());
        
        // Save the updated candidate
        JobCandidate updatedCandidate = jobCandidateRepository.save(candidate);
        
        // If proceed is true, promote the next highest score candidate from ON to PROCESSING
        if (request.getProceed() != null && request.getProceed()) {
            promoteNextCandidate(jobId, request.getInterval());
        }
        
        return mapToResponse(updatedCandidate);
    }
    
    private void promoteNextCandidate(Long jobId, Integer interval) {
        // Find all candidates with status ON for this job, sorted by score (highest first)
        List<JobCandidate> onCandidates = jobCandidateRepository.findByJobIdAndStatus(jobId, CandidateStatus.ON);
        
        if (!onCandidates.isEmpty()) {
            // Sort by score descending (null scores treated as 0.0)
            onCandidates.sort((c1, c2) -> {
                Double score1 = c1.getScore() != null ? c1.getScore() : 0.0;
                Double score2 = c2.getScore() != null ? c2.getScore() : 0.0;
                return Double.compare(score2, score1); // Descending order
            });
            
            // Promote the highest score candidate to PROCESSING
            JobCandidate nextCandidate = onCandidates.get(0);
            nextCandidate.setStatus(CandidateStatus.PROCESSING);
            
            // Set expire date if interval is provided
            if (interval != null && interval > 0) {
                LocalDate expireDate = LocalDate.now().plusDays(interval);
                nextCandidate.setExpireDate(expireDate);
            }
            
            jobCandidateRepository.save(nextCandidate);
        }
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