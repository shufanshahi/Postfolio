package com.example.postfolio.interview.repository;

import com.example.postfolio.interview.entity.InterviewProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewProgressRepository extends JpaRepository<InterviewProgress, Long> {
    
    List<InterviewProgress> findByProfileIdAndMockInterviewId(Long profileId, Long mockInterviewId);
    
    List<InterviewProgress> findByProfileId(Long profileId);
    
    List<InterviewProgress> findByMockInterviewId(Long mockInterviewId);
}
