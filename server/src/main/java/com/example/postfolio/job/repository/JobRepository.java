package com.example.postfolio.job.repository;

import com.example.postfolio.job.entity.Job;
import com.example.postfolio.job.model.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    
    /**
     * Find all jobs with the given status that have an end date before the specified date
     * Used by the scheduler to find expired jobs
     */
    List<Job> findByStatusAndEndDateBefore(JobStatus status, LocalDate date);
}
