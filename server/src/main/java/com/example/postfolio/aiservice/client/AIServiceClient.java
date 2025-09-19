package com.example.postfolio.aiservice.client;

import com.example.postfolio.aiservice.dto.*;
import com.example.postfolio.util.JwtTokenHelper;
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
import java.util.ArrayList;

@Component
@RequiredArgsConstructor
@Slf4j
public class AIServiceClient {

    private final WebClient.Builder webClientBuilder;
    private final JwtTokenHelper jwtTokenHelper;

    @Value("${ai-service.base-url}")
    private String aiServiceBaseUrl;

    @Value("${ai-service.timeout:30000}")
    private int timeout;

    /**
     * Create WebClient with JWT authorization header
     */
    private WebClient createWebClientWithAuth() {
        String authHeader = jwtTokenHelper.getAuthorizationHeader();
        if (authHeader != null) {
            return webClientBuilder
                    .baseUrl(aiServiceBaseUrl)
                    .defaultHeader("Authorization", authHeader)
                    .build();
        } else {
            log.warn("No JWT token found for AI service request");
            return webClientBuilder.baseUrl(aiServiceBaseUrl).build();
        }
    }

    @CircuitBreaker(name = "ai-service", fallbackMethod = "fallbackProcessPost")
    public PostProcessingResponse processPost(PostProcessingRequest request) {
        try {
            log.debug("Sending post processing request to AI service for post ID: {}", request.getPostId());

            WebClient webClient = createWebClientWithAuth();

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

            WebClient webClient = createWebClientWithAuth();

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

    @CircuitBreaker(name = "ai-service", fallbackMethod = "fallbackGenerateCustomInterview")
    public MockInterviewGenerationResponse generateCustomInterview(MockInterviewGenerationRequest request) {
        try {
            log.debug("Sending custom interview generation request to AI service for role: {}", request.getRole());

            WebClient webClient = createWebClientWithAuth();

            ResponseEntity<MockInterviewGenerationResponse> response = webClient.post()
                    .uri("/api/ai/generate-custom-interview")
                    .bodyValue(request)
                    .retrieve()
                    .toEntity(MockInterviewGenerationResponse.class)
                    .timeout(Duration.ofMillis(timeout))
                    .block();

            if (response != null && response.getStatusCode() == HttpStatus.OK) {
                log.debug("Successfully generated custom interview for role: {}", request.getRole());
                return response.getBody();
            } else {
                log.error("AI service returned non-OK status: {}",
                        response != null ? response.getStatusCode() : "null");
                throw new RuntimeException("AI service returned error status");
            }
        } catch (WebClientResponseException e) {
            log.error("AI service request failed with status: {} for role: {}", e.getStatusCode(),
                    request.getRole(), e);
            throw new RuntimeException("AI service call failed: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error calling AI service for role: {}", request.getRole(), e);
            throw new RuntimeException("AI service call failed: " + e.getMessage(), e);
        }
    }

    @CircuitBreaker(name = "ai-service", fallbackMethod = "fallbackEvaluateInterview")
    public InterviewEvaluationResponse evaluateInterview(InterviewEvaluationRequest request) {
        try {
            log.debug("Sending interview evaluation request to AI service with {} Q&A pairs",
                    request.getQuestionAnswers().size());

            WebClient webClient = createWebClientWithAuth();

            ResponseEntity<InterviewEvaluationResponse> response = webClient.post()
                    .uri("/api/ai/evaluate-interview")
                    .bodyValue(request)
                    .retrieve()
                    .toEntity(InterviewEvaluationResponse.class)
                    .timeout(Duration.ofMillis(timeout))
                    .block();

            if (response != null && response.getStatusCode() == HttpStatus.OK) {
                log.debug("Successfully evaluated interview with {} Q&A pairs",
                        request.getQuestionAnswers().size());
                return response.getBody();
            } else {
                log.error("AI service returned non-OK status: {}",
                        response != null ? response.getStatusCode() : "null");
                throw new RuntimeException("AI service returned error status");
            }
        } catch (WebClientResponseException e) {
            log.error("AI service request failed with status: {} for interview evaluation", e.getStatusCode(), e);
            throw new RuntimeException("AI service call failed: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error calling AI service for interview evaluation", e);
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

    public MockInterviewGenerationResponse fallbackGenerateCustomInterview(MockInterviewGenerationRequest request,
            Exception ex) {
        log.warn("AI service fallback triggered for custom interview generation. Role: {}. Error: {}",
                request.getRole(), ex.getMessage());

        return MockInterviewGenerationResponse.builder()
                .role(request.getRole())
                .experience(request.getExperience())
                .interviewType(request.getInterviewType())
                .introduction("Unable to generate interview questions at this time.")
                .questions(new ArrayList<>())
                .success(false)
                .errorMessage("AI service temporarily unavailable")
                .build();
    }

    public InterviewEvaluationResponse fallbackEvaluateInterview(InterviewEvaluationRequest request, Exception ex) {
        log.warn("AI service fallback triggered for interview evaluation. Error: {}", ex.getMessage());

        return InterviewEvaluationResponse.builder()
                .rating(0)
                .strengths(new ArrayList<>())
                .weaknesses(new ArrayList<>())
                .improvements(new ArrayList<>())
                .success(false)
                .errorMessage("AI service temporarily unavailable")
                .build();
    }
}
