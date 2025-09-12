package com.example.postfolio.jobcandidates.service;

import com.example.postfolio.job.entity.Job;
import com.example.postfolio.job.repository.JobRepository;
import com.example.postfolio.jobcandidates.entity.JobCandidate;
import com.example.postfolio.jobcandidates.model.CandidateStatus;
import com.example.postfolio.jobcandidates.repository.JobCandidateRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class JobCandidateSchedulerService {

    @Autowired
    private JobCandidateRepository jobCandidateRepository;
    
    @Autowired
    private JobRepository jobRepository;

    /**
     * Scheduled method that runs daily at midnight (00:00:00) to check for expired candidates
     * and promotes new candidates with highest scores to PROCESSING status
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void processExpiredCandidatesAndPromoteNew() {
        log.info("Starting daily candidate expiry check and promotion at {}", LocalDate.now());
        
        try {
            // Step 1: Find all PROCESSING candidates that have expired
            List<JobCandidate> expiredCandidates = jobCandidateRepository.findByStatusAndExpireDateBefore(
                CandidateStatus.PROCESSING, 
                LocalDate.now()
            );
            
            if (expiredCandidates.isEmpty()) {
                log.info("No expired candidates found");
                return;
            }
            
            // Step 2: Group expired candidates by jobId to process them efficiently
            Map<Long, List<JobCandidate>> expiredByJob = expiredCandidates.stream()
                .collect(Collectors.groupingBy(JobCandidate::getJobId));
            
            int totalExpired = 0;
            int totalPromoted = 0;
            
            // Step 3: Process each job separately
            for (Map.Entry<Long, List<JobCandidate>> entry : expiredByJob.entrySet()) {
                Long jobId = entry.getKey();
                List<JobCandidate> jobExpiredCandidates = entry.getValue();
                
                // Step 4: Set expired candidates to OFF
                for (JobCandidate candidate : jobExpiredCandidates) {
                    candidate.setStatus(CandidateStatus.OFF);
                    candidate.setExpireDate(null); // Clear expire date when setting to OFF
                    jobCandidateRepository.save(candidate);
                    totalExpired++;
                    log.info("Candidate ID {} for Job ID {} has been set to OFF due to expiration. Expire date was: {}", 
                        candidate.getId(), jobId, candidate.getExpireDate());
                }
                
                // Step 5: Find replacement candidates with highest scores
                int expiredCount = jobExpiredCandidates.size();
                List<JobCandidate> onCandidates = jobCandidateRepository.findByJobIdAndStatusOrderByScoreDesc(
                    jobId, CandidateStatus.ON
                );
                
                // Step 6: Promote top candidates to PROCESSING
                if (!onCandidates.isEmpty()) {
                    // Get the job to find expiry interval
                    Optional<Job> jobOpt = jobRepository.findById(jobId);
                    if (jobOpt.isPresent()) {
                        Job job = jobOpt.get();
                        Long expiryInterval = job.getExpiryInterval();
                        
                        // Calculate new expire date
                        LocalDate newExpireDate = null;
                        if (expiryInterval != null && expiryInterval > 0) {
                            newExpireDate = LocalDate.now().plusDays(expiryInterval);
                        }
                        
                        // Promote up to the number of expired candidates
                        int candidatesToPromote = Math.min(expiredCount, onCandidates.size());
                        
                        for (int i = 0; i < candidatesToPromote; i++) {
                            JobCandidate candidateToPromote = onCandidates.get(i);
                            candidateToPromote.setStatus(CandidateStatus.PROCESSING);
                            candidateToPromote.setExpireDate(newExpireDate);
                            jobCandidateRepository.save(candidateToPromote);
                            totalPromoted++;
                            
                            log.info("Candidate ID {} (Score: {}) for Job ID {} has been promoted to PROCESSING. New expire date: {}", 
                                candidateToPromote.getId(), 
                                candidateToPromote.getScore(),
                                jobId, 
                                newExpireDate);
                        }
                        
                        if (candidatesToPromote < expiredCount) {
                            log.warn("Job ID {}: Only {} candidates were available for promotion, but {} expired", 
                                jobId, candidatesToPromote, expiredCount);
                        }
                    } else {
                        log.error("Job ID {} not found, cannot determine expiry interval for promotion", jobId);
                    }
                } else {
                    // No ON candidates available for promotion - set AutoSelectStatus to COMPLETED
                    log.info("No ON candidates available for promotion for Job ID {}. Setting AutoSelectStatus to COMPLETED", jobId);
                    
                    Optional<Job> jobOpt = jobRepository.findById(jobId);
                    if (jobOpt.isPresent()) {
                        Job job = jobOpt.get();
                        job.setAutoSelectStatus(com.example.postfolio.job.model.AutoSelectStatus.COMPLETED);
                        jobRepository.save(job);
                        
                        log.info("Job ID {} AutoSelectStatus has been set to COMPLETED due to no available ON candidates", jobId);
                    } else {
                        log.error("Job ID {} not found, cannot update AutoSelectStatus", jobId);
                    }
                }
            }
            
            log.info("Candidate expiry processing completed. Expired: {}, Promoted: {}", totalExpired, totalPromoted);
            
        } catch (Exception e) {
            log.error("Error occurred while processing expired candidates: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Manual method to trigger the expiry process (useful for testing)
     */
    public void triggerCandidateExpiryProcess() {
        log.info("Manually triggered candidate expiry process");
        processExpiredCandidatesAndPromoteNew();
    }
}