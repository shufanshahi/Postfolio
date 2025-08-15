package com.example.postfolio.jobservice.job.repository;

import com.example.postfolio.jobservice.job.entity.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
} 