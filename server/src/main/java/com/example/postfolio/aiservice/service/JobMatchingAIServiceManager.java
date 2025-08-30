package com.example.postfolio.aiservice.service;

import com.example.postfolio.aiservice.dto.JobMatchingRequest;
import com.example.postfolio.aiservice.dto.JobMatchingResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobMatchingAIServiceManager {

    private final WebClient webClient;

    private static final String AI_SERVICE_URL = "http://localhost:8081";

    /**
     * Match job synchronously via direct HTTP call
     */
    public JobMatchingResponse matchJobSync(JobMatchingRequest request) {
        try {
            log.info("Sending synchronous job matching request to AI service for job: {} and profile: {}",
                    request.getJobId(), request.getProfileId());

            return webClient.post()
                    .uri(AI_SERVICE_URL + "/api/ai/match-job")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(JobMatchingResponse.class)
                    .timeout(Duration.ofSeconds(30))
                    .doOnSuccess(
                            response -> {
                                log.info("Job matching completed for job: {} and profile: {} with score: {}",
                                        request.getJobId(), request.getProfileId(), response.getScore());
                                log.debug("Full AI response: success={}, explanation={}, strengths={}, gaps={}",
                                        response.isSuccess(), response.getExplanation(),
                                        response.getStrengths(), response.getGaps());
                            })
                    .doOnError(error -> {
                        log.error("Job matching failed for job: {} and profile: {}",
                                request.getJobId(), request.getProfileId(), error);
                        log.error("AI service connection error details: {}", error.getMessage());
                    })
                    .block();

        } catch (Exception e) {
            log.error("Failed to send synchronous job matching request", e);
            throw new RuntimeException("Failed to send job matching request", e);
        }
    }
}
