package com.example.postfolio.job.service;

import com.example.postfolio.job.entity.Job;
import com.example.postfolio.job.model.JobStatus;
import com.example.postfolio.job.repository.JobRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Slf4j
public class JobSchedulerService {

    @Autowired
    private JobRepository jobRepository;

    /**
     * Scheduled method that runs daily at midnight (00:00:00) to check for expired jobs
     * and updates their status to CLOSED if current date > end_date
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void checkAndCloseExpiredJobs() {
        log.info("Starting daily job expiration check at {}", LocalDate.now());
        
        try {
            // Find all jobs that are currently OPEN and have expired
            List<Job> expiredJobs = jobRepository.findByStatusAndEndDateBefore(
                JobStatus.OPEN, 
                LocalDate.now()
            );
            
            if (expiredJobs.isEmpty()) {
                log.info("No expired jobs found");
                return;
            }
            
            int expiredCount = 0;
            for (Job job : expiredJobs) {
                job.setStatus(JobStatus.CLOSED);
                jobRepository.save(job);
                expiredCount++;
                log.info("Job ID {} '{}' has been closed due to expiration. End date was: {}", 
                    job.getJobId(), job.getTitle(), job.getEndDate());
            }
            
            log.info("Successfully closed {} expired job(s)", expiredCount);
            
        } catch (Exception e) {
            log.error("Error occurred while checking for expired jobs: {}", e.getMessage(), e);
        }
    }
}