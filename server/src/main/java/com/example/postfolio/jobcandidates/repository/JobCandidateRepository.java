package com.example.postfolio.jobcandidates.repository;

import com.example.postfolio.jobcandidates.entity.JobCandidate;
import com.example.postfolio.jobcandidates.model.CandidateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobCandidateRepository extends JpaRepository<JobCandidate, Long> {
    List<JobCandidate> findByJobId(Long jobId);
    List<JobCandidate> findByProfileId(Long profileId);
    List<JobCandidate> findByStatus(CandidateStatus status);
    List<JobCandidate> findByProfileIdAndStatus(Long profileId, CandidateStatus status);
    List<JobCandidate> findByProfileIdAndStatusIn(Long profileId, List<CandidateStatus> statuses);
    Optional<JobCandidate> findByJobIdAndProfileId(Long jobId, Long profileId);
    List<JobCandidate> findByJobIdAndStatus(Long jobId, CandidateStatus status);
    
    // Methods for candidate expiry scheduler
    /**
     * Find all PROCESSING candidates that have expired
     */
    List<JobCandidate> findByStatusAndExpireDateBefore(CandidateStatus status, LocalDate date);
    
    /**
     * Find ON candidates for a specific job ordered by score descending (highest first)
     */
    @Query("SELECT jc FROM JobCandidate jc WHERE jc.jobId = :jobId AND jc.status = :status ORDER BY jc.score DESC")
    List<JobCandidate> findByJobIdAndStatusOrderByScoreDesc(@Param("jobId") Long jobId, @Param("status") CandidateStatus status);
}