package com.example.postfolio.jobcandidates.repository;

import com.example.postfolio.jobcandidates.entity.JobCandidate;
import com.example.postfolio.jobcandidates.model.CandidateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobCandidateRepository extends JpaRepository<JobCandidate, Long> {
    List<JobCandidate> findByJobId(Long jobId);
    List<JobCandidate> findByProfileId(Long profileId);
    List<JobCandidate> findByStatus(CandidateStatus status);
    List<JobCandidate> findByProfileIdAndStatus(Long profileId, CandidateStatus status);
    Optional<JobCandidate> findByJobIdAndProfileId(Long jobId, Long profileId);
    List<JobCandidate> findByJobIdAndStatus(Long jobId, CandidateStatus status);
}