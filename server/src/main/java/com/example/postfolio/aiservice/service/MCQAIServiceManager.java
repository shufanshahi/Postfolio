package com.example.postfolio.aiservice.service;

import com.example.postfolio.aiservice.dto.MCQGenerationRequest;
import com.example.postfolio.aiservice.dto.MCQGenerationResponse;
import com.example.postfolio.util.JwtTokenHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class MCQAIServiceManager {

    private final RabbitTemplate rabbitTemplate;
    private final WebClient.Builder webClientBuilder;
    private final JwtTokenHelper jwtTokenHelper;

    @Value("${ai-service.base-url}")
    private String aiServiceBaseUrl;

    private static final String MCQ_QUEUE = "ai.mcq.generation";

    /**
     * Generate MCQs asynchronously via message queue
     */
    public void generateMCQsAsync(MCQGenerationRequest request) {
        try {
            log.info("Sending MCQ generation request to AI service for user: {}", request.getUserId());
            rabbitTemplate.convertAndSend(MCQ_QUEUE, request);
            log.info("MCQ generation request sent successfully");
        } catch (Exception e) {
            log.error("Failed to send MCQ generation request", e);
            throw new RuntimeException("Failed to send MCQ generation request", e);
        }
    }

    /**
     * Generate MCQs synchronously via direct HTTP call (for immediate response
     * needs)
     */
    public Mono<MCQGenerationResponse> generateMCQsSync(MCQGenerationRequest request) {
        try {
            log.info("Sending synchronous MCQ generation request to AI service for user: {}", request.getUserId());

            String authHeader = jwtTokenHelper.getAuthorizationHeader();
            WebClient.Builder builder = webClientBuilder.baseUrl(aiServiceBaseUrl);

            if (authHeader != null) {
                builder = builder.defaultHeader("Authorization", authHeader);
            }

            WebClient webClient = builder.build();

            return webClient.post()
                    .uri("/api/ai/generate-mcq")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(MCQGenerationResponse.class)
                    .timeout(Duration.ofSeconds(30))
                    .doOnSuccess(response -> log.info("MCQ generation completed for user: {}", request.getUserId()))
                    .doOnError(error -> log.error("MCQ generation failed for user: {}", request.getUserId(), error));

        } catch (Exception e) {
            log.error("Failed to send synchronous MCQ generation request", e);
            return Mono.error(new RuntimeException("Failed to send MCQ generation request", e));
        }
    }
}
