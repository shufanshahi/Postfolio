package com.example.postfolio.jobcandidates.service;

import com.example.postfolio.job.entity.Job;
import com.example.postfolio.job.repository.JobRepository;
import com.example.postfolio.jobcandidates.entity.JobCandidate;
import com.example.postfolio.jobcandidates.model.CandidateStatus;
import com.example.postfolio.jobcandidates.repository.JobCandidateRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobCandidateSchedulerServiceTest {

    @Mock
    private JobCandidateRepository jobCandidateRepository;
    
    @Mock
    private JobRepository jobRepository;

    @InjectMocks
    private JobCandidateSchedulerService jobCandidateSchedulerService;

    @Test
    void testProcessExpiredCandidatesAndPromoteNew_WithExpiredAndAvailableCandidates() {
        // Arrange
        LocalDate yesterday = LocalDate.now().minusDays(1);
        
        // Expired PROCESSING candidates
        JobCandidate expiredCandidate1 = JobCandidate.builder()
                .id(1L)
                .jobId(100L)
                .profileId(1L)
                .status(CandidateStatus.PROCESSING)
                .score(85.0)
                .expireDate(yesterday)
                .build();
                
        JobCandidate expiredCandidate2 = JobCandidate.builder()
                .id(2L)
                .jobId(100L)
                .profileId(2L)
                .status(CandidateStatus.PROCESSING)
                .score(80.0)
                .expireDate(yesterday)
                .build();
        
        List<JobCandidate> expiredCandidates = Arrays.asList(expiredCandidate1, expiredCandidate2);
        
        // ON candidates available for promotion (ordered by score DESC)
        JobCandidate onCandidate1 = JobCandidate.builder()
                .id(3L)
                .jobId(100L)
                .profileId(3L)
                .status(CandidateStatus.ON)
                .score(90.0)
                .build();
                
        JobCandidate onCandidate2 = JobCandidate.builder()
                .id(4L)
                .jobId(100L)
                .profileId(4L)
                .status(CandidateStatus.ON)
                .score(88.0)
                .build();
                
        List<JobCandidate> onCandidates = Arrays.asList(onCandidate1, onCandidate2);
        
        // Job with expiry interval
        Job job = Job.builder()
                .jobId(100L)
                .expiryInterval(7L) // 7 days
                .build();
        
        // Mock repository calls
        when(jobCandidateRepository.findByStatusAndExpireDateBefore(CandidateStatus.PROCESSING, LocalDate.now()))
                .thenReturn(expiredCandidates);
        when(jobCandidateRepository.findByJobIdAndStatusOrderByScoreDesc(100L, CandidateStatus.ON))
                .thenReturn(onCandidates);
        when(jobRepository.findById(100L))
                .thenReturn(Optional.of(job));

        // Act
        jobCandidateSchedulerService.processExpiredCandidatesAndPromoteNew();

        // Assert
        // Verify expired candidates were set to OFF
        verify(jobCandidateRepository, times(4)).save(any(JobCandidate.class));
        
        // Verify the status changes
        assert(expiredCandidate1.getStatus() == CandidateStatus.OFF);
        assert(expiredCandidate2.getStatus() == CandidateStatus.OFF);
        assert(expiredCandidate1.getExpireDate() == null);
        assert(expiredCandidate2.getExpireDate() == null);
        
        // Verify promoted candidates
        assert(onCandidate1.getStatus() == CandidateStatus.PROCESSING);
        assert(onCandidate2.getStatus() == CandidateStatus.PROCESSING);
        assert(onCandidate1.getExpireDate().equals(LocalDate.now().plusDays(7)));
        assert(onCandidate2.getExpireDate().equals(LocalDate.now().plusDays(7)));
    }

    @Test
    void testProcessExpiredCandidatesAndPromoteNew_NoExpiredCandidates() {
        // Arrange
        when(jobCandidateRepository.findByStatusAndExpireDateBefore(CandidateStatus.PROCESSING, LocalDate.now()))
                .thenReturn(Collections.emptyList());

        // Act
        jobCandidateSchedulerService.processExpiredCandidatesAndPromoteNew();

        // Assert
        verify(jobCandidateRepository).findByStatusAndExpireDateBefore(CandidateStatus.PROCESSING, LocalDate.now());
        verify(jobCandidateRepository, never()).save(any(JobCandidate.class));
        verify(jobRepository, never()).findById(any());
    }

    @Test
    void testProcessExpiredCandidatesAndPromoteNew_NoAvailableCandidatesForPromotion() {
        // Arrange
        LocalDate yesterday = LocalDate.now().minusDays(1);
        
        JobCandidate expiredCandidate = JobCandidate.builder()
                .id(1L)
                .jobId(100L)
                .profileId(1L)
                .status(CandidateStatus.PROCESSING)
                .score(85.0)
                .expireDate(yesterday)
                .build();
        
        Job job = Job.builder()
                .jobId(100L)
                .autoSelectStatus(com.example.postfolio.job.model.AutoSelectStatus.ONGOING)
                .build();
        
        List<JobCandidate> expiredCandidates = Arrays.asList(expiredCandidate);
        
        when(jobCandidateRepository.findByStatusAndExpireDateBefore(CandidateStatus.PROCESSING, LocalDate.now()))
                .thenReturn(expiredCandidates);
        when(jobCandidateRepository.findByJobIdAndStatusOrderByScoreDesc(100L, CandidateStatus.ON))
                .thenReturn(Collections.emptyList());
        when(jobRepository.findById(100L))
                .thenReturn(Optional.of(job));

        // Act
        jobCandidateSchedulerService.processExpiredCandidatesAndPromoteNew();

        // Assert
        // Should save expired candidate (set to OFF) and update job (set AutoSelectStatus to COMPLETED)
        verify(jobCandidateRepository, times(1)).save(any(JobCandidate.class));
        verify(jobRepository, times(1)).save(any(Job.class));
        
        assert(expiredCandidate.getStatus() == CandidateStatus.OFF);
        assert(expiredCandidate.getExpireDate() == null);
        assert(job.getAutoSelectStatus() == com.example.postfolio.job.model.AutoSelectStatus.COMPLETED);
    }

    @Test
    void testProcessExpiredCandidatesAndPromoteNew_JobNotFound() {
        // Arrange
        LocalDate yesterday = LocalDate.now().minusDays(1);
        
        JobCandidate expiredCandidate = JobCandidate.builder()
                .id(1L)
                .jobId(999L) // Non-existent job
                .profileId(1L)
                .status(CandidateStatus.PROCESSING)
                .score(85.0)
                .expireDate(yesterday)
                .build();
        
        JobCandidate onCandidate = JobCandidate.builder()
                .id(2L)
                .jobId(999L)
                .profileId(2L)
                .status(CandidateStatus.ON)
                .score(90.0)
                .build();
        
        when(jobCandidateRepository.findByStatusAndExpireDateBefore(CandidateStatus.PROCESSING, LocalDate.now()))
                .thenReturn(Arrays.asList(expiredCandidate));
        when(jobCandidateRepository.findByJobIdAndStatusOrderByScoreDesc(999L, CandidateStatus.ON))
                .thenReturn(Arrays.asList(onCandidate));
        when(jobRepository.findById(999L))
                .thenReturn(Optional.empty());

        // Act
        jobCandidateSchedulerService.processExpiredCandidatesAndPromoteNew();

        // Assert
        // Only expired candidate should be saved (set to OFF), no promotion should happen
        verify(jobCandidateRepository, times(1)).save(any(JobCandidate.class));
        verify(jobRepository, never()).save(any(Job.class));
        assert(expiredCandidate.getStatus() == CandidateStatus.OFF);
        assert(onCandidate.getStatus() == CandidateStatus.ON); // Should remain unchanged
    }

    @Test
    void testProcessExpiredCandidatesAndPromoteNew_NoAvailableCandidatesJobNotFound() {
        // Arrange
        LocalDate yesterday = LocalDate.now().minusDays(1);
        
        JobCandidate expiredCandidate = JobCandidate.builder()
                .id(1L)
                .jobId(999L) // Non-existent job
                .profileId(1L)
                .status(CandidateStatus.PROCESSING)
                .score(85.0)
                .expireDate(yesterday)
                .build();
        
        when(jobCandidateRepository.findByStatusAndExpireDateBefore(CandidateStatus.PROCESSING, LocalDate.now()))
                .thenReturn(Arrays.asList(expiredCandidate));
        when(jobCandidateRepository.findByJobIdAndStatusOrderByScoreDesc(999L, CandidateStatus.ON))
                .thenReturn(Collections.emptyList());
        when(jobRepository.findById(999L))
                .thenReturn(Optional.empty());

        // Act
        jobCandidateSchedulerService.processExpiredCandidatesAndPromoteNew();

        // Assert
        // Only expired candidate should be saved (set to OFF), no AutoSelectStatus update should happen
        verify(jobCandidateRepository, times(1)).save(any(JobCandidate.class));
        verify(jobRepository, never()).save(any(Job.class));
        assert(expiredCandidate.getStatus() == CandidateStatus.OFF);
    }

    @Test
    void testProcessExpiredCandidatesAndPromoteNew_MultipleJobs() {
        // Arrange
        LocalDate yesterday = LocalDate.now().minusDays(1);
        
        // Expired candidates from different jobs
        JobCandidate expiredJob1 = JobCandidate.builder()
                .id(1L)
                .jobId(100L)
                .profileId(1L)
                .status(CandidateStatus.PROCESSING)
                .score(85.0)
                .expireDate(yesterday)
                .build();
                
        JobCandidate expiredJob2 = JobCandidate.builder()
                .id(2L)
                .jobId(200L)
                .profileId(2L)
                .status(CandidateStatus.PROCESSING)
                .score(80.0)
                .expireDate(yesterday)
                .build();
        
        // ON candidates for both jobs
        JobCandidate onJob1 = JobCandidate.builder()
                .id(3L)
                .jobId(100L)
                .profileId(3L)
                .status(CandidateStatus.ON)
                .score(90.0)
                .build();
                
        JobCandidate onJob2 = JobCandidate.builder()
                .id(4L)
                .jobId(200L)
                .profileId(4L)
                .status(CandidateStatus.ON)
                .score(88.0)
                .build();
        
        Job job1 = Job.builder().jobId(100L).expiryInterval(5L).build();
        Job job2 = Job.builder().jobId(200L).expiryInterval(10L).build();
        
        when(jobCandidateRepository.findByStatusAndExpireDateBefore(CandidateStatus.PROCESSING, LocalDate.now()))
                .thenReturn(Arrays.asList(expiredJob1, expiredJob2));
        when(jobCandidateRepository.findByJobIdAndStatusOrderByScoreDesc(100L, CandidateStatus.ON))
                .thenReturn(Arrays.asList(onJob1));
        when(jobCandidateRepository.findByJobIdAndStatusOrderByScoreDesc(200L, CandidateStatus.ON))
                .thenReturn(Arrays.asList(onJob2));
        when(jobRepository.findById(100L)).thenReturn(Optional.of(job1));
        when(jobRepository.findById(200L)).thenReturn(Optional.of(job2));

        // Act
        jobCandidateSchedulerService.processExpiredCandidatesAndPromoteNew();

        // Assert
        verify(jobCandidateRepository, times(4)).save(any(JobCandidate.class));
        
        // Check expired candidates
        assert(expiredJob1.getStatus() == CandidateStatus.OFF);
        assert(expiredJob2.getStatus() == CandidateStatus.OFF);
        
        // Check promoted candidates with different expiry intervals
        assert(onJob1.getStatus() == CandidateStatus.PROCESSING);
        assert(onJob2.getStatus() == CandidateStatus.PROCESSING);
        assert(onJob1.getExpireDate().equals(LocalDate.now().plusDays(5)));
        assert(onJob2.getExpireDate().equals(LocalDate.now().plusDays(10)));
    }

    @Test
    void testTriggerCandidateExpiryProcess() {
        // Arrange
        when(jobCandidateRepository.findByStatusAndExpireDateBefore(CandidateStatus.PROCESSING, LocalDate.now()))
                .thenReturn(Collections.emptyList());

        // Act
        jobCandidateSchedulerService.triggerCandidateExpiryProcess();

        // Assert
        verify(jobCandidateRepository).findByStatusAndExpireDateBefore(CandidateStatus.PROCESSING, LocalDate.now());
    }
}