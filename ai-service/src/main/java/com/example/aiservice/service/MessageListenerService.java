package com.example.aiservice.service;

import com.example.aiservice.config.RabbitConfig;
import com.example.aiservice.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageListenerService {

    private final PostAIService postAIService;
    private final JobMatchingAIService jobMatchingAIService;
    private final MCQGenerationAIService mcqGenerationAIService;
    private final InterviewGenerationAIService interviewGenerationAIService;
    private final RabbitTemplate rabbitTemplate;

    @RabbitListener(queues = RabbitConfig.POST_PROCESSING_QUEUE)
    public void handlePostProcessing(PostProcessingRequest request) {
        try {
            log.info("Received post processing request for post ID: {}", request.getPostId());
            PostProcessingResponse response = postAIService.processPost(request);

            // Send result back to main app
            rabbitTemplate.convertAndSend(RabbitConfig.POST_RESULT_QUEUE, response);
            log.info("Sent post processing result for post ID: {}", request.getPostId());

        } catch (Exception e) {
            log.error("Error processing post message for post ID: {}", request.getPostId(), e);

            PostProcessingResponse errorResponse = PostProcessingResponse.builder()
                    .postId(request.getPostId())
                    .success(false)
                    .errorMessage("Message processing failed: " + e.getMessage())
                    .build();

            rabbitTemplate.convertAndSend(RabbitConfig.POST_RESULT_QUEUE, errorResponse);
        }
    }

    @RabbitListener(queues = RabbitConfig.JOB_MATCHING_QUEUE)
    public void handleJobMatching(JobMatchingRequest request) {
        try {
            log.info("Received job matching request for job ID: {} and profile ID: {}",
                    request.getJobId(), request.getProfileId());

            JobMatchingResponse response = jobMatchingAIService.matchJob(request);

            // Send result back to main app
            rabbitTemplate.convertAndSend(RabbitConfig.JOB_RESULT_QUEUE, response);
            log.info("Sent job matching result for job ID: {} and profile ID: {}",
                    request.getJobId(), request.getProfileId());

        } catch (Exception e) {
            log.error("Error processing job matching message for job ID: {} and profile ID: {}",
                    request.getJobId(), request.getProfileId(), e);

            JobMatchingResponse errorResponse = JobMatchingResponse.builder()
                    .jobId(request.getJobId())
                    .profileId(request.getProfileId())
                    .success(false)
                    .errorMessage("Message processing failed: " + e.getMessage())
                    .build();

            rabbitTemplate.convertAndSend(RabbitConfig.JOB_RESULT_QUEUE, errorResponse);
        }
    }

    @RabbitListener(queues = RabbitConfig.MCQ_GENERATION_QUEUE)
    public void handleMCQGeneration(MCQGenerationRequest request) {
        try {
            log.info("Received MCQ generation request for user ID: {}", request.getUserId());
            MCQGenerationResponse response = mcqGenerationAIService.generateMCQ(request);

            // Send result back to main app
            rabbitTemplate.convertAndSend(RabbitConfig.MCQ_RESULT_QUEUE, response);
            log.info("Sent MCQ generation result for user ID: {}", request.getUserId());

        } catch (Exception e) {
            log.error("Error processing MCQ generation message for user ID: {}", request.getUserId(), e);

            MCQGenerationResponse errorResponse = MCQGenerationResponse.builder()
                    .userId(request.getUserId())
                    .success(false)
                    .errorMessage("Message processing failed: " + e.getMessage())
                    .build();

            rabbitTemplate.convertAndSend(RabbitConfig.MCQ_RESULT_QUEUE, errorResponse);
        }
    }

    @RabbitListener(queues = RabbitConfig.INTERVIEW_GENERATION_QUEUE)
    public void handleInterviewGeneration(InterviewGenerationRequest request) {
        try {
            log.info("Received interview generation request for user ID: {}", request.getUserId());
            InterviewGenerationResponse response = interviewGenerationAIService.generateInterview(request);

            // Send result back to main app
            rabbitTemplate.convertAndSend(RabbitConfig.INTERVIEW_RESULT_QUEUE, response);
            log.info("Sent interview generation result for user ID: {}", request.getUserId());

        } catch (Exception e) {
            log.error("Error processing interview generation message for user ID: {}", request.getUserId(), e);

            InterviewGenerationResponse errorResponse = InterviewGenerationResponse.builder()
                    .userId(request.getUserId())
                    .success(false)
                    .errorMessage("Message processing failed: " + e.getMessage())
                    .build();

            rabbitTemplate.convertAndSend(RabbitConfig.INTERVIEW_RESULT_QUEUE, errorResponse);
        }
    }
}
