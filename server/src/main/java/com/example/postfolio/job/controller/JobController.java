
package com.example.postfolio.job.controller;

import com.example.postfolio.job.dto.AutoSelectRequest;
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
import java.util.Optional;
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

    @PostMapping("/{jobId}/auto-select")
    public ResponseEntity<JobResponse> startAutoSelect(@PathVariable Long jobId, @RequestBody AutoSelectRequest request) {
        try {
            JobResponse jobResponse = jobService.startAutoSelect(jobId, request);
            return ResponseEntity.ok(jobResponse);
        } catch (RuntimeException e) {
            log.error("Failed to start auto-select for job {}", jobId, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error while starting auto-select for job {}", jobId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{jobId}/accept/{profileId}")
    public ResponseEntity<JobResponse> acceptJobOffer(
            @PathVariable Long jobId, 
            @PathVariable Long profileId) {
        try {
            JobResponse jobResponse = jobService.acceptJobOffer(jobId, profileId);
            return ResponseEntity.ok(jobResponse);
        } catch (RuntimeException e) {
            log.error("Failed to accept job offer for job {} by profile {}", jobId, profileId, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error while accepting job offer for job {} by profile {}", jobId, profileId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{jobId}/auto-select-status")
    public ResponseEntity<JobResponse> updateAutoSelectStatus(@PathVariable Long jobId) {
        try {
            JobResponse jobResponse = jobService.updateAutoSelectStatus(jobId);
            return ResponseEntity.ok(jobResponse);
        } catch (RuntimeException e) {
            log.error("Failed to update auto-select status for job {}", jobId, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error while updating auto-select status for job {}", jobId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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
                            .selectedApplicantIds(job.getSelectedApplicants().stream().map(Profile::getId)
                                    .collect(Collectors.toList()))
                            .autoSelectStatus(job.getAutoSelectStatus())
                            .offerLetter(job.getOfferLetter())
                            .desiredSelectNumber(job.getDesiredSelectNumber())
                            .letterExpiry(job.getLetterExpiry())
                            .acceptedByProfileIds(job.getAcceptedByProfileIds())
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
                            .selectedApplicantIds(job.getSelectedApplicants().stream().map(Profile::getId)
                                    .collect(Collectors.toList()))
                            .autoSelectStatus(job.getAutoSelectStatus())
                            .offerLetter(job.getOfferLetter())
                            .desiredSelectNumber(job.getDesiredSelectNumber())
                            .letterExpiry(job.getLetterExpiry())
                            .acceptedByProfileIds(job.getAcceptedByProfileIds())
                            .matchingScore(createFallbackResult("Scoring failed"))
                            .build();

                    jobsWithScores.add(jobWithScore);
                }
            }

            jobsWithScores.sort((a, b) -> Integer.compare(
                    b.getMatchingScore().getTotalScore(),
                    a.getMatchingScore().getTotalScore()));

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

    @PostMapping("/cache/refresh")
    public ResponseEntity<Map<String, String>> refreshJobMatchingCache(Authentication authentication) {
        try {
            // Get current user's profile
            Optional<Profile> profileOpt = profileService.getMyProfile();

            if (profileOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Profile userProfile = profileOpt.get();

            // Clear all cache entries for this user by stable profile ID
            jobMatchingService.invalidateProfileCache(userProfile);

            log.info("Cache refreshed for user: {}", userProfile.getId());

            Map<String, String> response = new java.util.HashMap<>();
            response.put("message", "Job matching cache cleared successfully");
            response.put("status", "success");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to refresh job matching cache", e);
            Map<String, String> response = new java.util.HashMap<>();
            response.put("message", "Failed to refresh cache: " + e.getMessage());
            response.put("status", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
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
