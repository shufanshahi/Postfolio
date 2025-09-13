package com.example.postfolio.aiservice.service;

import com.example.postfolio.aiservice.client.AIServiceClient;
import com.example.postfolio.aiservice.dto.*;
import com.example.postfolio.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIServiceManager {

    private final AIServiceClient aiServiceClient;
    private final RabbitTemplate rabbitTemplate;

    /**
     * Process post synchronously via HTTP
     */
    public PostProcessingResponse processPost(PostProcessingRequest request) {
        return aiServiceClient.processPost(request);
    }

    /**
     * Process post asynchronously via RabbitMQ
     */
    @Async
    public CompletableFuture<Void> processPostAsync(PostProcessingRequest request) {
        try {
            log.info("Sending post processing request via RabbitMQ for post ID: {}", request.getPostId());
            rabbitTemplate.convertAndSend(RabbitMQConfig.AI_EXCHANGE, "ai.post.process", request);
            log.debug("Successfully sent post processing request for post ID: {}", request.getPostId());
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("Failed to send post processing request for post ID: {}", request.getPostId(), e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Match job synchronously via HTTP
     */
    public JobMatchingResponse matchJob(JobMatchingRequest request) {
        return aiServiceClient.matchJob(request);
    }

    /**
     * Generate custom interview synchronously via HTTP
     */
    public MockInterviewGenerationResponse generateCustomInterview(MockInterviewGenerationRequest request) {
        return aiServiceClient.generateCustomInterview(request);
    }

    /**
     * Evaluate interview synchronously via HTTP
     */
    public InterviewEvaluationResponse evaluateInterview(InterviewEvaluationRequest request) {
        return aiServiceClient.evaluateInterview(request);
    }

    /**
     * Generate MCQ asynchronously via RabbitMQ
     */
    @Async
    public CompletableFuture<Void> generateMCQAsync(MCQGenerationRequest request) {
        try {
            log.info("Sending MCQ generation request via RabbitMQ for user ID: {}", request.getUserId());
            rabbitTemplate.convertAndSend(RabbitMQConfig.AI_EXCHANGE, "ai.mcq.generate", request);
            log.debug("Successfully sent MCQ generation request for user ID: {}", request.getUserId());
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("Failed to send MCQ generation request for user ID: {}", request.getUserId(), e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Generate interview questions asynchronously via RabbitMQ
     */
    @Async
    public CompletableFuture<Void> generateInterviewAsync(InterviewGenerationRequest request) {
        try {
            log.info("Sending interview generation request via RabbitMQ for user ID: {}", request.getUserId());
            rabbitTemplate.convertAndSend(RabbitMQConfig.AI_EXCHANGE, "ai.interview.generate", request);
            log.debug("Successfully sent interview generation request for user ID: {}", request.getUserId());
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("Failed to send interview generation request for user ID: {}", request.getUserId(), e);
            return CompletableFuture.failedFuture(e);
        }
    }
}
