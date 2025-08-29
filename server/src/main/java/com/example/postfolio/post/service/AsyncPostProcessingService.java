package com.example.postfolio.post.service;

import com.example.postfolio.cvInApp.service.CvUpdateService;
import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.models.PostType;
import com.example.postfolio.post.repository.PostRepository;
import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.service.WorkService;
import com.example.postfolio.profile.dto.WorkDto;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncPostProcessingService {

    private final GeminiService geminiService;
    private final PostRepository postRepository;
    private final CvUpdateService cvUpdateService;
    private final WorkService workService;
    private final UserRepository userRepository;

    @Async("aiProcessingExecutor")
    @Transactional
    public CompletableFuture<Void> processPostAsync(Long postId, String content, Profile profile) {
        try {
            log.info("Starting async AI processing for post ID: {}", postId);

            // Call Gemini AI service
            GeminiService.GeminiResponse analysis = geminiService.analyzePost(content);

            // Get the post from database
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Post not found: " + postId));

            // Update post with AI analysis results
            updatePostWithAIAnalysis(post, analysis, profile);

            // Save updated post
            postRepository.save(post);

            log.info("Completed async AI processing for post ID: {}", postId);

        } catch (Exception e) {
            log.error("Failed to process post async for ID: {}", postId, e);
            handleProcessingFailure(postId, e);
        }

        return CompletableFuture.completedFuture(null);
    }

    @Async("aiProcessingExecutor")
    @Transactional
    public CompletableFuture<Void> reprocessPostAsync(Long postId, Profile profile) {
        try {
            log.info("Starting async AI reprocessing for post ID: {}", postId);

            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Post not found: " + postId));

            PostType previousType = post.getType();

            // Call Gemini AI service
            GeminiService.GeminiResponse analysis = geminiService.analyzePost(post.getContent());

            // Handle EXPERIENCE type specially
            if (analysis.getPostType() == PostType.EXPERIENCE) {
                // Create work entry from tags
                createWorkFromExperiencePost(analysis, profile);

                // Update post as GENERAL to not show in CV
                post.setType(PostType.GENERAL);
                post.setTags(new ArrayList<>());
                post.setCvHeading(analysis.getSummary());
                post.setAutoTagged(true);
                post.setUpdatedAt(LocalDateTime.now());

                // Remove from CV if it was there
                cvUpdateService.removeCvEntriesByPostId(postId);
            } else {
                // Normal flow for other post types
                post.setType(analysis.getPostType());
                post.setTags(new ArrayList<>(analysis.getTags()));
                post.setCvHeading(analysis.getSummary());
                post.setAutoTagged(true);
                post.setUpdatedAt(LocalDateTime.now());

                // Handle CV updates based on post type changes
                if (analysis.isCvRelevant()) {
                    cvUpdateService.updateCvFromPost(post);
                } else if (previousType != PostType.GENERAL) {
                    // Post was CV-relevant before but now is GENERAL, remove from CV
                    cvUpdateService.removeCvEntriesByPostId(postId);
                }
            }

            // Save updated post
            postRepository.save(post);

            log.info("Completed async AI reprocessing for post ID: {}", postId);

        } catch (Exception e) {
            log.error("Failed to reprocess post async for ID: {}", postId, e);
            handleProcessingFailure(postId, e);
        }

        return CompletableFuture.completedFuture(null);
    }

    private void updatePostWithAIAnalysis(Post post, GeminiService.GeminiResponse analysis, Profile profile) {
        // Handle EXPERIENCE type specially
        if (analysis.getPostType() == PostType.EXPERIENCE) {
            // Create work entry from tags
            createWorkFromExperiencePost(analysis, profile);

            // Update post as GENERAL to not show in CV
            post.setType(PostType.GENERAL);
            post.setTags(new ArrayList<>());
            post.setCvHeading(analysis.getSummary());
            post.setAutoTagged(true);
            post.setUpdatedAt(LocalDateTime.now());
        } else {
            // Regular post processing
            post.setType(analysis.getPostType());
            post.setTags(new ArrayList<>(analysis.getTags()));
            post.setCvHeading(analysis.getSummary());
            post.setAutoTagged(true);
            post.setUpdatedAt(LocalDateTime.now());

            // Update CV if the post is CV-relevant (not GENERAL)
            if (analysis.isCvRelevant()) {
                cvUpdateService.updateCvFromPost(post);
            }
        }
    }

    /**
     * Creates a Work entry from EXPERIENCE post analysis
     * Expected tags format: "Company Name,Position,Date" or "Company
     * Name,Position,none"
     */
    private void createWorkFromExperiencePost(GeminiService.GeminiResponse analysis, Profile profile) {
        try {
            List<String> tags = analysis.getTags();
            if (tags.isEmpty()) {
                log.warn("No tags found for EXPERIENCE post, skipping work creation");
                return;
            }

            // Parse tags - expecting format: "Company Name,Position,Date"
            String tagString = tags.get(0); // Take first tag which should contain all info
            String[] parts = tagString.split(",");

            if (parts.length < 2) {
                log.warn("Invalid tag format for EXPERIENCE post: {}", tagString);
                return;
            }

            String companyName = parts[0].trim();
            String position = parts[1].trim();
            String dateString = parts.length > 2 ? parts[2].trim() : "none";

            LocalDate startDate;
            if ("none".equals(dateString) || dateString.isEmpty()) {
                // Use current date if no date provided
                startDate = LocalDate.now();
            } else {
                startDate = parseDateString(dateString);
            }

            // Get user from profile
            User user = profile.getUser();
            if (user == null) {
                // Try to get user by email from security context
                user = userRepository.findByEmail(
                        org.springframework.security.core.context.SecurityContextHolder
                                .getContext().getAuthentication().getName())
                        .orElse(null);
            }

            if (user != null) {
                // Create WorkDto
                WorkDto workDto = WorkDto.builder()
                        .companyName(companyName)
                        .position(position)
                        .startDate(startDate)
                        .endDate(null) // No end date as it's a new position
                        .isCurrent(true) // Assume it's current position
                        .build();

                // Create work entry
                workService.createWork(workDto, user);
                log.info("Created work entry: {} at {}", position, companyName);
            } else {
                log.warn("Could not find user for profile {}", profile.getId());
            }

        } catch (Exception e) {
            log.error("Failed to create work entry from EXPERIENCE post: {}", e.getMessage());
        }
    }

    /**
     * Parses date string from various formats
     */
    private LocalDate parseDateString(String dateString) {
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
                if (dateString.matches("\\d{1,2} \\w+$")) {
                    // Format like "21 January" - add current year
                    dateString += " " + LocalDate.now().getYear();
                }
                return LocalDate.parse(dateString, formatter);
            } catch (DateTimeParseException e) {
                // Try next formatter
            }
        }

        // If all parsing fails, return current date
        log.warn("Could not parse date: {}, using current date", dateString);
        return LocalDate.now();
    }

    private void handleProcessingFailure(Long postId, Exception error) {
        try {
            Post post = postRepository.findById(postId).orElse(null);
            if (post != null) {
                post.setCvHeading("AI processing failed: " + error.getMessage());
                post.setAutoTagged(false);
                postRepository.save(post);
            }
        } catch (Exception e) {
            log.error("Failed to update post processing status", e);
        }
    }
}
