package com.example.postfolio.jobMatchingEngine.service;

import com.example.postfolio.job.entity.Job;
import com.example.postfolio.jobMatchingEngine.client.GeminiClient;
import com.example.postfolio.jobMatchingEngine.dto.ApplicantProfileDTO;
import com.example.postfolio.jobMatchingEngine.dto.MatchingResult;
import com.example.postfolio.profile.entity.Profile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncJobMatchingService {

    private final GeminiClient geminiClient;
    private final JobMatchingService jobMatchingService;
    private final JobMatchingCacheService cacheService;

    @Async
    public CompletableFuture<MatchingResult> scoreApplicantAsync(Job job, Profile applicant) {
        try {
            log.info("Starting async job matching for job {} and profile {}", job.getJobId(), applicant.getId());

            // Generate cache key
            String profileHash = jobMatchingService.generateProfileHash(applicant);
            String jobHash = jobMatchingService.generateJobHash(job);
            String cacheKey = cacheService.generateCacheKey(profileHash, jobHash);

            // Check Redis cache first
            MatchingResult cached = cacheService.getCachedResult(cacheKey);
            if (cached != null) {
                log.debug("Using cached score for job {} and profile {}", job.getJobId(), applicant.getId());
                return CompletableFuture.completedFuture(cached);
            }

            // Calculate new score
            ApplicantProfileDTO profileDTO = jobMatchingService.buildApplicantProfile(applicant);
            String prompt = jobMatchingService.buildScoringPrompt(job, profileDTO);
            String response = geminiClient.generateContent(prompt);
            MatchingResult result = jobMatchingService.parseGeminiResponse(response);

            // Cache the result in Redis
            cacheService.cacheResult(cacheKey, result);

            log.info("Completed async job matching for job {} and profile {}", job.getJobId(), applicant.getId());
            return CompletableFuture.completedFuture(result);

        } catch (Exception e) {
            log.error("Async job matching failed for job: {} and applicant: {}", job.getJobId(), applicant.getId(), e);
            MatchingResult fallbackResult = jobMatchingService.createFallbackResult(e.getMessage());
            return CompletableFuture.completedFuture(fallbackResult);
        }
    }

    @Async
    public CompletableFuture<Void> precomputeJobMatches(Job job) {
        try {
            log.info("Starting precomputation of matches for job {}", job.getJobId());

            // This could be used to precompute matches for all profiles
            // when a new job is posted (background task)

            log.info("Completed precomputation of matches for job {}", job.getJobId());

        } catch (Exception e) {
            log.error("Failed to precompute matches for job {}", job.getJobId(), e);
        }

        return CompletableFuture.completedFuture(null);
    }
}
