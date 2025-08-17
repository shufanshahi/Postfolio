package com.example.postfolio.interview.repository;

import com.example.postfolio.interview.entity.Interview;
import com.example.postfolio.interview.model.InterviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {
    
    List<Interview> findByJobId(Long jobId);
    
    List<Interview> findByProfileId(Long profileId);
    
    List<Interview> findByStatus(InterviewStatus status);
    
    List<Interview> findByJobIdAndStatus(Long jobId, InterviewStatus status);
    
    List<Interview> findByProfileIdAndStatus(Long profileId, InterviewStatus status);
    
    @Query("SELECT i FROM Interview i WHERE i.schedule BETWEEN :startDate AND :endDate")
    List<Interview> findInterviewsInDateRange(@Param("startDate") LocalDateTime startDate, 
                                            @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT i FROM Interview i WHERE i.profileId = :profileId AND i.schedule > :currentTime")
    List<Interview> findUpcomingInterviewsByProfile(@Param("profileId") Long profileId, 
                                                  @Param("currentTime") LocalDateTime currentTime);
    
    @Query("SELECT i FROM Interview i WHERE i.jobId = :jobId AND i.schedule > :currentTime")
    List<Interview> findUpcomingInterviewsByJob(@Param("jobId") Long jobId, 
                                              @Param("currentTime") LocalDateTime currentTime);
    
    boolean existsByJobIdAndProfileId(Long jobId, Long profileId);

    Interview findByProfileIdAndJobId(Long profileId, Long jobId);
}
