
package com.example.postfolio.job.controller;

import com.example.postfolio.job.dto.JobRequest;
import com.example.postfolio.job.dto.JobResponse;
import com.example.postfolio.job.dto.JobWithScoreDTO;
import com.example.postfolio.job.entity.Job;
import com.example.postfolio.job.model.JobStatus;
import com.example.postfolio.job.service.JobService;
import com.example.postfolio.jobMatchingEngine.dto.MatchingResult;
import com.example.postfolio.jobMatchingEngine.service.JobMatchingService;
import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@Slf4j
public class JobController {
    private final JobService jobService;
    private final JobMatchingService jobMatchingService;
    private final ProfileService profileService;

    @PostMapping
    public ResponseEntity<JobResponse> createJob(@RequestBody JobRequest request) {
        return ResponseEntity.ok(jobService.createJob(request));
    }

    @GetMapping("/employer/{employerId}")
    public ResponseEntity<List<JobResponse>> getJobsByEmployer(@PathVariable Long employerId) {
        return ResponseEntity.ok(jobService.getJobsByEmployer(employerId));
    }

    @GetMapping
    public ResponseEntity<List<JobResponse>> getAllJobs() {
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    @PostMapping("/{jobId}/apply/{applicantId}")
    public ResponseEntity<JobResponse> applyForJob(
            @PathVariable Long jobId,
            @PathVariable Long applicantId) {
        return ResponseEntity.ok(jobService.applyForJob(jobId, applicantId));
    }

    @GetMapping("/employer/ajob/{jobId}")
    public ResponseEntity<JobResponse> getJobById(@PathVariable Long jobId) {
        return ResponseEntity.ok(jobService.getJobById(jobId));
    }

    @PostMapping("/{jobId}/reject/{applicantId}")
    public ResponseEntity<JobResponse> rejectApplicant(@PathVariable Long jobId, @PathVariable Long applicantId) {
        try {
            JobResponse jobResponse = jobService.rejectApplicant(jobId, applicantId);
            return ResponseEntity.ok(jobResponse);
        } catch (RuntimeException e) {
            log.error("Failed to reject applicant {} for job {}", applicantId, jobId, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error while rejecting applicant {} for job {}", applicantId, jobId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    @PostMapping("/{jobId}/select/{applicantId}")
    public ResponseEntity<JobResponse> selectApplicant(@PathVariable Long jobId, @PathVariable Long applicantId) {
        try {
            JobResponse jobResponse = jobService.selectApplicant(jobId, applicantId);
            return ResponseEntity.ok(jobResponse);
        } catch (RuntimeException e) {
            log.error("Failed to select applicant {} for job {}", applicantId, jobId, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error while selecting applicant {} for job {}", applicantId, jobId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{jobId}/details")
    public ResponseEntity<JobResponse> getJobDetails(@PathVariable Long jobId) {
        try {
            JobResponse jobDetails = jobService.getJobDetails(jobId);
            return ResponseEntity.ok(jobDetails);
        } catch (RuntimeException e) {
            log.error("Failed to get job details for job ID: {}", jobId, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error while getting job details for job ID: {}", jobId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{jobId}/withdraw/{applicantId}")
    public ResponseEntity<JobResponse> withdrawApplication(
            @PathVariable Long jobId,
            @PathVariable Long applicantId) {
        return ResponseEntity.ok(jobService.withdrawApplication(jobId, applicantId));
    }

    @DeleteMapping("/{jobId}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long jobId) {
        jobService.deleteJob(jobId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{jobId}/status")
    public ResponseEntity<JobResponse> updateJobStatus(@PathVariable Long jobId, @RequestParam JobStatus status) {
        return ResponseEntity.ok(jobService.updateJobStatus(jobId, status));
    }

    @GetMapping("/matched")
    public ResponseEntity<List<JobWithScoreDTO>> getMatchedJobsForUser(Authentication authentication) {
        try {
            Profile userProfile = profileService.getMyProfile()
                    .orElseThrow(() -> new RuntimeException("Profile not found for current user"));

            List<Job> allJobs = jobService.findAllActiveJobs();
            List<JobWithScoreDTO> jobsWithScores = new ArrayList<>();

            for (Job job : allJobs) {
                try {
                    MatchingResult matchingResult = jobMatchingService.scoreApplicant(job, userProfile);

                    JobWithScoreDTO jobWithScore = JobWithScoreDTO.builder()
                            .jobId(job.getJobId())
                            .title(job.getTitle())
                            .position(job.getPosition())
                            .description(job.getDescription())
                            .datePosted(job.getDatePosted())
                            .endDate(job.getEndDate())
                            .status(job.getStatus())
                            .employerId(job.getEmployer() != null ? job.getEmployer().getId() : null)
                            .requiredProject(job.getRequiredProject())
                            .requiredExperience(job.getRequiredExperience())
                            .requiredEducation(job.getRequiredEducation())
                            .requiredSkills(job.getRequiredSkills())
                            .applicantIds(job.getApplicants().stream().map(Profile::getId).collect(Collectors.toList()))
                            .selectedApplicantIds(job.getSelectedApplicants().stream().map(Profile::getId).collect(Collectors.toList()))
                            .matchingScore(matchingResult)
                            .build();

                    jobsWithScores.add(jobWithScore);
                } catch (Exception e) {
                    log.error("Failed to score job {} for user {}", job.getJobId(), userProfile.getId(), e);
                    JobWithScoreDTO jobWithScore = JobWithScoreDTO.builder()
                            .jobId(job.getJobId())
                            .title(job.getTitle())
                            .position(job.getPosition())
                            .description(job.getDescription())
                            .datePosted(job.getDatePosted())
                            .endDate(job.getEndDate())
                            .status(job.getStatus())
                            .employerId(job.getEmployer() != null ? job.getEmployer().getId() : null)
                            .requiredProject(job.getRequiredProject())
                            .requiredExperience(job.getRequiredExperience())
                            .requiredEducation(job.getRequiredEducation())
                            .requiredSkills(job.getRequiredSkills())
                            .applicantIds(job.getApplicants().stream().map(Profile::getId).collect(Collectors.toList()))
                            .selectedApplicantIds(job.getSelectedApplicants().stream().map(Profile::getId).collect(Collectors.toList()))
                            .matchingScore(createFallbackResult("Scoring failed"))
                            .build();

                    jobsWithScores.add(jobWithScore);
                }
            }

            jobsWithScores.sort((a, b) -> Integer.compare(
                    b.getMatchingScore().getTotalScore(),
                    a.getMatchingScore().getTotalScore()
            ));

            return ResponseEntity.ok(jobsWithScores);
        } catch (Exception e) {
            log.error("Failed to get matched jobs for user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{jobId}/score/{profileId}")
    public ResponseEntity<MatchingResult> getJobScore(@PathVariable Long jobId, @PathVariable Long profileId) {
        try {
            Job job = jobService.findById(jobId);
            Profile profile = profileService.getProfileById(profileId);

            MatchingResult result = jobMatchingService.scoreApplicant(job, profile);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to get job score for job {} and profile {}", jobId, profileId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/cache/stats")
    public ResponseEntity<Map<String, Object>> getCacheStats() {
        try {
            Map<String, Object> stats = jobMatchingService.getCacheStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Failed to get cache stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/cache/cleanup")
    public ResponseEntity<Map<String, Object>> cleanupCache() {
        try {
            jobMatchingService.cleanupExpiredCache();
            Map<String, Object> stats = jobMatchingService.getCacheStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Failed to cleanup cache", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private MatchingResult createFallbackResult(String message) {
        return MatchingResult.builder()
                .totalScore(0)
                .skillsScore(0)
                .experienceScore(0)
                .educationScore(0)
                .additionalScore(0)
                .explanation(message)
                .strengths(List.of())
                .gaps(List.of("Manual review required"))
                .build();
    }
}
