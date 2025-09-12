package com.example.postfolio.job.service;

import com.example.postfolio.job.entity.Job;
import com.example.postfolio.job.model.JobStatus;
import com.example.postfolio.job.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobSchedulerServiceTest {

    @Mock
    private JobRepository jobRepository;

    @InjectMocks
    private JobSchedulerService jobSchedulerService;

    @Test
    void testCheckAndCloseExpiredJobs_WithExpiredJobs() {
        // Arrange
        LocalDate yesterday = LocalDate.now().minusDays(1);
        Job expiredJob1 = Job.builder()
                .jobId(1L)
                .title("Software Developer")
                .status(JobStatus.OPEN)
                .endDate(yesterday)
                .build();

        Job expiredJob2 = Job.builder()
                .jobId(2L)
                .title("Data Analyst")
                .status(JobStatus.OPEN)
                .endDate(yesterday)
                .build();

        List<Job> expiredJobs = Arrays.asList(expiredJob1, expiredJob2);

        when(jobRepository.findByStatusAndEndDateBefore(JobStatus.OPEN, LocalDate.now()))
                .thenReturn(expiredJobs);

        // Act
        jobSchedulerService.checkAndCloseExpiredJobs();

        // Assert
        verify(jobRepository).findByStatusAndEndDateBefore(JobStatus.OPEN, LocalDate.now());
        verify(jobRepository, times(2)).save(any(Job.class));
        
        // Verify that both jobs' status was set to CLOSED
        assert(expiredJob1.getStatus() == JobStatus.CLOSED);
        assert(expiredJob2.getStatus() == JobStatus.CLOSED);
    }

    @Test
    void testCheckAndCloseExpiredJobs_NoExpiredJobs() {
        // Arrange
        when(jobRepository.findByStatusAndEndDateBefore(JobStatus.OPEN, LocalDate.now()))
                .thenReturn(Collections.emptyList());

        // Act
        jobSchedulerService.checkAndCloseExpiredJobs();

        // Assert
        verify(jobRepository).findByStatusAndEndDateBefore(JobStatus.OPEN, LocalDate.now());
        verify(jobRepository, never()).save(any(Job.class));
    }

    @Test
    void testCheckAndCloseExpiredJobs_OnlyClosedJobsExpired() {
        // Arrange - Jobs that are already CLOSED should not be processed
        when(jobRepository.findByStatusAndEndDateBefore(JobStatus.OPEN, LocalDate.now()))
                .thenReturn(Collections.emptyList());

        // Act
        jobSchedulerService.checkAndCloseExpiredJobs();

        // Assert
        verify(jobRepository).findByStatusAndEndDateBefore(JobStatus.OPEN, LocalDate.now());
        verify(jobRepository, never()).save(any(Job.class));
    }
}