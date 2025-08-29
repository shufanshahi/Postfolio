package com.example.postfolio.aiservice.service;

import com.example.postfolio.aiservice.dto.*;
import com.example.postfolio.config.RabbitMQConfig;
import com.example.postfolio.cvInApp.service.CvUpdateService;
import com.example.postfolio.mcqGeneration.entity.MCQQuestion;
import com.example.postfolio.mcqGeneration.entity.MCQSet;
import com.example.postfolio.mcqGeneration.repository.MCQSetRepository;
import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.models.PostType;
import com.example.postfolio.post.repository.PostRepository;
import com.example.postfolio.profile.dto.WorkDto;
import com.example.postfolio.profile.service.WorkService;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIResultListener {

    private final PostRepository postRepository;
    private final CvUpdateService cvUpdateService;
    private final WorkService workService;
    private final UserRepository userRepository;
    private final MCQSetRepository mcqSetRepository;

    @RabbitListener(queues = RabbitMQConfig.POST_RESULT_QUEUE)
    @Transactional
    public void handlePostProcessingResult(PostProcessingResponse response) {
        try {
            log.info("Received post processing result for post ID: {}", response.getPostId());

            if (response.isSuccess()) {
                Post post = postRepository.findById(response.getPostId()).orElse(null);
                if (post != null) {
                    // Store original type for comparison
                    PostType previousType = post.getType();

                    // Determine the new post type
                    PostType newType = PostType.GENERAL;
                    if (response.getPostType() != null) {
                        try {
                            newType = PostType.valueOf(response.getPostType());
                            log.info("Post {} classified as: {}", response.getPostId(), newType);
                        } catch (IllegalArgumentException e) {
                            log.warn("Unknown post type: {}, keeping as GENERAL", response.getPostType());
                            newType = PostType.GENERAL;
                        }
                    } else {
                        log.warn("No post type received in response for post {}", response.getPostId());
                    }

                    // Debug: Log the response details
                    log.info("AI Response for post {}: type={}, cvHeading={}, tags={}",
                            response.getPostId(), response.getPostType(), response.getCvHeading(), response.getTags());

                    // Handle EXPERIENCE type specially
                    if (newType == PostType.EXPERIENCE) {
                        log.info("Processing EXPERIENCE post - creating work entry and setting post to GENERAL");

                        // Eagerly fetch post with profile and user to avoid lazy loading issues
                        Post postWithProfile = postRepository.findByIdWithProfileAndUser(response.getPostId());
                        if (postWithProfile != null && postWithProfile.getProfile() != null) {
                            // Create work entry from tags
                            createWorkFromExperiencePost(response, postWithProfile.getProfile());
                        } else {
                            log.warn("Could not find post or profile for EXPERIENCE post {}", response.getPostId());
                        }

                        // Update post as GENERAL to not show in CV
                        post.setType(PostType.GENERAL);
                        post.setTags(new ArrayList<>());
                        post.setCvHeading(response.getCvHeading());
                        post.setAutoTagged(response.isAutoTagged());
                        post.setUpdatedAt(LocalDateTime.now());

                        // Remove from CV if it was there
                        cvUpdateService.removeCvEntriesByPostId(response.getPostId());
                        log.info("EXPERIENCE post {} converted to GENERAL and removed from CV", response.getPostId());
                    } else {
                        // Normal flow for other post types
                        post.setType(newType);
                        post.setTags(
                                response.getTags() != null ? new ArrayList<>(response.getTags()) : new ArrayList<>());
                        post.setCvHeading(response.getCvHeading());
                        post.setAutoTagged(response.isAutoTagged());
                        post.setUpdatedAt(LocalDateTime.now());

                        // Handle CV updates based on post type changes
                        if (isPostTypeCvRelevant(newType)) {
                            cvUpdateService.updateCvFromPost(post);
                        } else if (previousType != PostType.GENERAL) {
                            // Post was CV-relevant before but now is GENERAL, remove from CV
                            cvUpdateService.removeCvEntriesByPostId(response.getPostId());
                        }
                    }

                    postRepository.save(post);
                    log.info("Successfully updated post {} with AI results", response.getPostId());
                } else {
                    log.warn("Post not found for ID: {}", response.getPostId());
                }
            } else {
                log.error("AI processing failed for post {}: {}",
                        response.getPostId(), response.getErrorMessage());

                // Optionally mark the post as needing manual review
                Post post = postRepository.findById(response.getPostId()).orElse(null);
                if (post != null) {
                    post.setCvHeading("Manual review required");
                    post.setAutoTagged(false);
                    postRepository.save(post);
                }
            }
        } catch (Exception e) {
            log.error("Error handling post processing result for post ID: {}", response.getPostId(), e);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.JOB_RESULT_QUEUE)
    public void handleJobMatchingResult(JobMatchingResponse response) {
        try {
            log.info("Received job matching result for job {} and profile {} with score: {}",
                    response.getJobId(), response.getProfileId(), response.getScore());

            if (response.isSuccess()) {
                // Here you can store the job matching results in your database
                // For example, save to a JobMatchingResult entity
                log.info("Job matching completed successfully: Job {} - Profile {} - Score: {} - Explanation: {}",
                        response.getJobId(), response.getProfileId(), response.getScore(), response.getExplanation());

                // You might want to store this in a separate table or cache
                // jobMatchingResultService.saveResult(response);
            } else {
                log.error("Job matching failed for job {} and profile {}: {}",
                        response.getJobId(), response.getProfileId(), response.getErrorMessage());
            }
        } catch (Exception e) {
            log.error("Error handling job matching result for job {} and profile {}",
                    response.getJobId(), response.getProfileId(), e);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.MCQ_RESULT_QUEUE)
    @Transactional
    public void handleMCQGenerationResult(MCQGenerationResponse response) {
        try {
            log.info("Received MCQ generation result for user {}", response.getUserId());

            if (response.isSuccess()) {
                log.info("MCQ generation completed successfully for user {} with {} questions",
                        response.getUserId(), response.getQuestions().size());

                // Store MCQ results in database
                saveMCQSet(response);
                log.info("MCQ set saved successfully for user {} with document: {}",
                        response.getUserId(), response.getDocumentName());
            } else {
                log.error("MCQ generation failed for user {}: {}",
                        response.getUserId(), response.getErrorMessage());
            }
        } catch (Exception e) {
            log.error("Error handling MCQ generation result for user {}", response.getUserId(), e);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.INTERVIEW_RESULT_QUEUE)
    public void handleInterviewGenerationResult(InterviewGenerationResponse response) {
        try {
            log.info("Received interview generation result for user {}", response.getUserId());

            if (response.isSuccess()) {
                log.info("Interview generation completed successfully for user {} with {} questions",
                        response.getUserId(), response.getQuestions().size());

                // Store interview results in database
                // interviewService.saveGeneratedQuestions(response);
            } else {
                log.error("Interview generation failed for user {}: {}",
                        response.getUserId(), response.getErrorMessage());
            }
        } catch (Exception e) {
            log.error("Error handling interview generation result for user {}", response.getUserId(), e);
        }
    }

    /**
     * Creates a Work entry from EXPERIENCE post analysis
     * Expected tags format: "Company Name,Position,Date" or "Company
     * Name,Position,none"
     */
    private void createWorkFromExperiencePost(PostProcessingResponse response,
            com.example.postfolio.profile.entity.Profile profile) {
        try {
            log.info("Starting createWorkFromExperiencePost for post ID: {}", response.getPostId());

            List<String> tags = response.getTags();
            log.info("Tags received: {}", tags);

            if (tags == null || tags.isEmpty()) {
                log.warn("No tags found for EXPERIENCE post, skipping work creation");
                return;
            }

            // Parse tags - handle both cases:
            // Case 1: Single element with comma-separated string: ["Google,Software
            // Developer,none"]
            // Case 2: Multiple elements: ["Google", "Software Developer", "none"]
            String[] parts;
            if (tags.size() == 1 && tags.get(0).contains(",")) {
                // Case 1: Single comma-separated string
                String tagString = tags.get(0);
                log.info("Processing single comma-separated tag string: '{}'", tagString);
                parts = tagString.split(",");
            } else if (tags.size() >= 2) {
                // Case 2: Multiple elements
                log.info("Processing multiple tag elements: {}", tags);
                parts = tags.toArray(new String[0]);
            } else {
                log.warn(
                        "Invalid tag format for EXPERIENCE post. Expected comma-separated values or multiple elements, got: {}",
                        tags);
                return;
            }

            log.info("Split into {} parts: {}", parts.length, java.util.Arrays.toString(parts));

            if (parts.length < 2) {
                log.warn("Invalid tag format for EXPERIENCE post: need at least company and position, got: {}",
                        java.util.Arrays.toString(parts));
                return;
            }

            String companyName = parts[0].trim();
            String position = parts[1].trim();
            String dateString = parts.length > 2 ? parts[2].trim() : "none";

            log.info("Parsed - Company: '{}', Position: '{}', Date: '{}'", companyName, position, dateString);

            LocalDate startDate;
            if ("none".equals(dateString) || dateString.isEmpty()) {
                // Use current date if no date provided
                startDate = LocalDate.now();
                log.info("Using current date: {}", startDate);
            } else {
                startDate = parseDateString(dateString);
                log.info("Parsed date: {}", startDate);
            }

            // Get user from profile
            User user = profile.getUser();
            log.info("User from profile: {}", user != null ? user.getId() : "null");

            if (user == null) {
                log.info("User is null, trying to get from security context");
                // Try to get user by email from security context
                String currentUserEmail = null;
                try {
                    currentUserEmail = org.springframework.security.core.context.SecurityContextHolder
                            .getContext().getAuthentication().getName();
                    log.info("Current user email from security context: {}", currentUserEmail);

                    user = userRepository.findByEmail(currentUserEmail).orElse(null);
                    log.info("User found by email: {}", user != null ? user.getId() : "null");
                } catch (Exception e) {
                    log.error("Error getting user from security context: {}", e.getMessage());
                }
            }

            if (user != null) {
                log.info("Creating WorkDto for user: {}", user.getId());

                // Create WorkDto
                WorkDto workDto = WorkDto.builder()
                        .companyName(companyName)
                        .position(position)
                        .startDate(startDate)
                        .endDate(null) // No end date as it's a new position
                        .isCurrent(true) // Assume it's current position
                        .build();

                log.info("WorkDto created: {}", workDto);

                // Create work entry
                workService.createWork(workDto, user);
                log.info("Successfully created work entry: {} at {}", position, companyName);
            } else {
                log.warn("Could not find user for profile {}", profile.getId());
            }

        } catch (Exception e) {
            log.error("Failed to create work entry from EXPERIENCE post: {}", e.getMessage(), e);
        }
    }

    /**
     * Parses date string from various formats
     */
    private LocalDate parseDateString(String dateString) {
        try {
            // Try common date formats
            DateTimeFormatter[] formatters = {
                    DateTimeFormatter.ofPattern("d MMMM yyyy"),
                    DateTimeFormatter.ofPattern("d MMMM"),
                    DateTimeFormatter.ofPattern("MMMM yyyy"),
                    DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                    DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                    DateTimeFormatter.ofPattern("MM/dd/yyyy")
            };

            for (DateTimeFormatter formatter : formatters) {
                try {
                    return LocalDate.parse(dateString, formatter);
                } catch (DateTimeParseException ignored) {
                    // Continue to next format
                }
            }

            // If all formats fail, use current date
            log.warn("Could not parse date: {}, using current date", dateString);
            return LocalDate.now();

        } catch (Exception e) {
            log.warn("Error parsing date: {}, using current date", dateString);
            return LocalDate.now();
        }
    }

    /**
     * Determines if a post type is CV-relevant
     */
    private boolean isPostTypeCvRelevant(PostType type) {
        return type == PostType.PROJECT ||
                type == PostType.SKILL ||
                type == PostType.ACHIEVEMENT;
        // Note: EXPERIENCE is handled separately and converted to GENERAL
    }

    /**
     * Saves MCQ generation results to database
     */
    private void saveMCQSet(MCQGenerationResponse response) {
        try {
            // Create MCQ Set
            MCQSet mcqSet = new MCQSet(response.getUserId(), response.getDocumentName());
            mcqSet = mcqSetRepository.save(mcqSet);

            // Create MCQ Questions
            List<MCQQuestion> questions = new ArrayList<>();
            for (MCQGenerationResponse.MCQQuestionDTO dto : response.getQuestions()) {
                MCQQuestion question = new MCQQuestion();
                question.setMcqSet(mcqSet);
                question.setQuestion(dto.getQuestion());
                question.setOptionA(dto.getOptionA());
                question.setOptionB(dto.getOptionB());
                question.setOptionC(dto.getOptionC());
                question.setOptionD(dto.getOptionD());
                question.setCorrectAnswer(dto.getCorrectAnswer());
                question.setExplanation(dto.getExplanation());
                questions.add(question);
            }

            mcqSet.setQuestions(questions);
            mcqSetRepository.save(mcqSet);

            log.info("Successfully saved MCQ set with {} questions for user {}",
                    questions.size(), response.getUserId());

        } catch (Exception e) {
            log.error("Failed to save MCQ set for user {}: {}", response.getUserId(), e.getMessage(), e);
            throw new RuntimeException("Failed to save MCQ set", e);
        }
    }
}