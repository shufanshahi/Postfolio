package com.example.postfolio.aiservice.client;

import com.example.postfolio.aiservice.dto.*;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;

@Component
@RequiredArgsConstructor
@Slf4j
public class AIServiceClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${ai-service.base-url}")
    private String aiServiceBaseUrl;

    @Value("${ai-service.timeout:30000}")
    private int timeout;

    @CircuitBreaker(name = "ai-service", fallbackMethod = "fallbackProcessPost")
    public PostProcessingResponse processPost(PostProcessingRequest request) {
        try {
            log.debug("Sending post processing request to AI service for post ID: {}", request.getPostId());

            WebClient webClient = webClientBuilder.baseUrl(aiServiceBaseUrl).build();

            ResponseEntity<PostProcessingResponse> response = webClient.post()
                    .uri("/api/ai/process-post")
                    .bodyValue(request)
                    .retrieve()
                    .toEntity(PostProcessingResponse.class)
                    .timeout(Duration.ofMillis(timeout))
                    .block();

            if (response != null && response.getStatusCode() == HttpStatus.OK) {
                log.debug("Successfully processed post ID: {}", request.getPostId());
                return response.getBody();
            } else {
                log.error("AI service returned non-OK status: {}",
                        response != null ? response.getStatusCode() : "null");
                throw new RuntimeException("AI service returned error status");
            }
        } catch (WebClientResponseException e) {
            log.error("AI service request failed with status: {} for post ID: {}", e.getStatusCode(),
                    request.getPostId(), e);
            throw new RuntimeException("AI service call failed: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error calling AI service for post ID: {}", request.getPostId(), e);
            throw new RuntimeException("AI service call failed: " + e.getMessage(), e);
        }
    }

    @CircuitBreaker(name = "ai-service", fallbackMethod = "fallbackMatchJob")
    public JobMatchingResponse matchJob(JobMatchingRequest request) {
        try {
            log.debug("Sending job matching request to AI service for job ID: {} and profile ID: {}",
                    request.getJobId(), request.getProfileId());

            WebClient webClient = webClientBuilder.baseUrl(aiServiceBaseUrl).build();

            ResponseEntity<JobMatchingResponse> response = webClient.post()
                    .uri("/api/ai/match-job")
                    .bodyValue(request)
                    .retrieve()
                    .toEntity(JobMatchingResponse.class)
                    .timeout(Duration.ofMillis(timeout))
                    .block();

            if (response != null && response.getStatusCode() == HttpStatus.OK) {
                log.debug("Successfully matched job ID: {} with profile ID: {}",
                        request.getJobId(), request.getProfileId());
                return response.getBody();
            } else {
                log.error("AI service returned non-OK status: {}",
                        response != null ? response.getStatusCode() : "null");
                throw new RuntimeException("AI service returned error status");
            }
        } catch (WebClientResponseException e) {
            log.error("AI service request failed with status: {} for job ID: {} and profile ID: {}",
                    e.getStatusCode(), request.getJobId(), request.getProfileId(), e);
            throw new RuntimeException("AI service call failed: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error calling AI service for job ID: {} and profile ID: {}",
                    request.getJobId(), request.getProfileId(), e);
            throw new RuntimeException("AI service call failed: " + e.getMessage(), e);
        }
    }

    // Fallback methods for circuit breaker
    public PostProcessingResponse fallbackProcessPost(PostProcessingRequest request, Exception ex) {
        log.warn("AI service fallback triggered for post processing. Post ID: {}. Error: {}",
                request.getPostId(), ex.getMessage());

        return PostProcessingResponse.builder()
                .postId(request.getPostId())
                .cvHeading("Professional Update")
                .tags(java.util.Arrays.asList("experience", "professional"))
                .autoTagged(false)
                .postType("GENERAL")
                .success(false)
                .errorMessage("AI service temporarily unavailable")
                .build();
    }

    public JobMatchingResponse fallbackMatchJob(JobMatchingRequest request, Exception ex) {
        log.warn("AI service fallback triggered for job matching. Job ID: {}, Profile ID: {}. Error: {}",
                request.getJobId(), request.getProfileId(), ex.getMessage());

        return JobMatchingResponse.builder()
                .jobId(request.getJobId())
                .profileId(request.getProfileId())
                .score(0.5) // Neutral score
                .explanation("Unable to calculate match score - AI service unavailable")
                .strengths("Manual review required")
                .gaps("Cannot determine without AI analysis")
                .recommendations("Please try again later")
                .success(false)
                .errorMessage("AI service temporarily unavailable")
                .build();
    }
}
