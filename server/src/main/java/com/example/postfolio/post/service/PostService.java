package com.example.postfolio.post.service;

import com.example.postfolio.aiservice.dto.PostProcessingRequest;
import com.example.postfolio.aiservice.service.AIServiceManager;
import com.example.postfolio.cvInApp.service.CvUpdateService;
import com.example.postfolio.notification.service.NotificationService;
import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.models.PostType;
import com.example.postfolio.post.repository.PostRepository;
import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.service.ProfileService;
import com.example.postfolio.profile.service.WorkService;
import com.example.postfolio.profile.dto.WorkDto;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.example.postfolio.post.entity.Reaction;
import com.example.postfolio.post.model.ReactionType;
import com.example.postfolio.post.repository.ReactionRepository;
import com.example.postfolio.post.dto.ReactionResponseDTO;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final ProfileService profileService;
    private final CvUpdateService cvUpdateService;
    private final UserRepository userRepository;
    private final ReactionRepository reactionRepository;
    private final NotificationService notificationService;
    private final AIServiceManager aiServiceManager;
    private final WorkService workService;

    @Transactional
    public Post createPost(Long profileId, String content, List<String> images) {
        Profile profile = profileService.getProfileById(profileId);

        // Validate image count
        if (images != null && images.size() > 4) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Maximum 4 images allowed per post");
        }

        // Validate base64 images
        if (images != null) {
            images = validateAndCleanImages(images);
        }

        // Check if user is an EMPLOYER - if so, skip AI processing
        boolean isEmployer = profile.getUser().getRole().name().equals("Employer");

        if (isEmployer) {
            // For EMPLOYER users: directly create post as GENERAL type without AI
            // processing
            log.info("Creating post for EMPLOYER user - skipping AI analysis and setting as GENERAL type");
            Post savedPost = savePost(content, profile, PostType.GENERAL,
                    List.of(), "General Post", true, images);
            log.info("EMPLOYER post created with ID: {} - no AI processing required", savedPost.getId());
            return savedPost;
        } else {
            // For regular users: Save post immediately with default values for fast
            // response (200ms)
            Post savedPost = savePost(content, profile, PostType.GENERAL,
                    List.of(), "Processing...", false, images);

            // Trigger async AI processing in background (2-5s)
            PostProcessingRequest request = PostProcessingRequest.builder()
                    .postId(savedPost.getId())
                    .content(content)
                    .profileId(profile.getId())
                    .profileBio(profile.getBio())
                    .profilePosition(profile.getPositionOrInstitue())
                    .build();
            aiServiceManager.processPostAsync(request);

            return savedPost;
        }
    }

    @Transactional
    public Post reprocessPostWithAI(Long postId, Long profileId) {
        Post post = getPostById(postId);
        validatePostOwnership(post, profileId);
        Profile profile = post.getProfile();

        // Check if user is an EMPLOYER - if so, skip AI processing
        boolean isEmployer = profile.getUser().getRole().name().equals("Employer");

        if (isEmployer) {
            // For EMPLOYER users: directly set as GENERAL type without AI processing
            log.info("Reprocessing post for EMPLOYER user - skipping AI analysis and setting as GENERAL type");
            post.setCvHeading("General Post");
            post.setAutoTagged(true);
            post.setType(PostType.GENERAL);
            post.setUpdatedAt(LocalDateTime.now());
            Post savedPost = postRepository.save(post);
            log.info("EMPLOYER post reprocessed with ID: {} - no AI processing required", savedPost.getId());
            return savedPost;
        } else {
            // Update post status to indicate reprocessing
            post.setCvHeading("Reprocessing...");
            post.setAutoTagged(false);
            post.setUpdatedAt(LocalDateTime.now());
            Post savedPost = postRepository.save(post);

            // Trigger async reprocessing
            PostProcessingRequest request = PostProcessingRequest.builder()
                    .postId(postId)
                    .content(post.getContent())
                    .profileId(profile.getId())
                    .profileBio(profile.getBio())
                    .profilePosition(profile.getPositionOrInstitue())
                    .build();
            aiServiceManager.processPostAsync(request);

            return savedPost;
        }
    }

    @Transactional
    public Post updatePost(Long postId, Long profileId, String newContent, List<String> images) {
        Post post = getPostById(postId);
        validatePostOwnership(post, profileId);
        Profile profile = post.getProfile();

        // Validate image count
        if (images != null && images.size() > 4) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Maximum 4 images allowed per post");
        }

        // Validate and clean images
        if (images != null) {
            images = validateAndCleanImages(images);
        }

        // Check if user is an EMPLOYER - if so, skip AI processing
        boolean isEmployer = profile.getUser().getRole().name().equals("Employer");

        // Update post content and images immediately
        post.setContent(newContent);
        post.setImages(images != null ? new ArrayList<>(images) : new ArrayList<>());
        post.setUpdatedAt(LocalDateTime.now());

        if (isEmployer) {
            // For EMPLOYER users: directly set as GENERAL type without AI processing
            log.info("Updating post for EMPLOYER user - skipping AI analysis and setting as GENERAL type");
            post.setCvHeading("General Post");
            post.setAutoTagged(true);
            post.setType(PostType.GENERAL);
            Post savedPost = postRepository.save(post);
            log.info("EMPLOYER post updated with ID: {} - no AI processing required", savedPost.getId());
            return savedPost;
        } else {
            // For regular users: trigger AI reprocessing
            post.setCvHeading("Processing...");
            post.setAutoTagged(false);

            // Save immediately for fast response
            Post savedPost = postRepository.save(post);

            // Trigger async reprocessing with new content
            PostProcessingRequest request = PostProcessingRequest.builder()
                    .postId(postId)
                    .content(newContent)
                    .profileId(profile.getId())
                    .profileBio(profile.getBio())
                    .profilePosition(profile.getPositionOrInstitue())
                    .build();
            aiServiceManager.processPostAsync(request);

            return savedPost;
        }
    }

    // ... (rest of the existing methods remain unchanged)

    @Transactional(readOnly = true)
    public List<String> getProfileSkills(Long profileId) {
        Profile profile = profileService.getProfileById(profileId);
        return postRepository.findDistinctTagsByProfileId(profile.getId());
    }

    @Transactional(readOnly = true)
    public Post getPostById(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Post not found with id: " + postId));
    }

    @Transactional(readOnly = true)
    public List<Post> getAllPostsByProfile(Long profileId) {
        Profile profile = profileService.getProfileById(profileId);
        return postRepository.findByProfileOrderByCreatedAtDesc(profile);
    }

    @Transactional(readOnly = true)
    public Page<Post> getPaginatedPostsByProfile(Long profileId, Pageable pageable) {
        Profile profile = profileService.getProfileById(profileId);
        return postRepository.findByProfile(profile, pageable);
    }

    @Transactional(readOnly = true)
    public List<Post> getPostsByType(Long profileId, PostType type) {
        Profile profile = profileService.getProfileById(profileId);
        return postRepository.findByProfileAndTypeOrderByCreatedAtDesc(profile, type);
    }

    @Transactional(readOnly = true)
    public List<Post> getPostsByTag(Long profileId, String tag) {
        Profile profile = profileService.getProfileById(profileId);
        return postRepository.findByProfileAndTagsContaining(profile, tag);
    }

    @Transactional(readOnly = true)
    public List<Post> getFeedPosts() {
        User currentUser = getCurrentUser();
        return postRepository.findPostsFromFriendsAndSelf(currentUser);
    }

    @Transactional
    public Post updatePostTags(Long postId, Long profileId, List<String> tags) {
        Post post = getPostById(postId);
        validatePostOwnership(post, profileId);
        post.setTags(tags);
        post.setUpdatedAt(LocalDateTime.now());
        post.setAutoTagged(false);

        Post savedPost = postRepository.save(post);

        // Only update CV if post is not GENERAL type
        if (post.getType() != PostType.GENERAL) {
            cvUpdateService.updateCvFromPost(savedPost);
        }

        return savedPost;
    }

    @Transactional(readOnly = true)
    public Page<Post> getPostsNeedingReview(Long profileId, Pageable pageable) {
        Profile profile = profileService.getProfileById(profileId);
        return postRepository.findByProfileAndAutoTaggedFalse(profile, pageable);
    }

    @Transactional(readOnly = true)
    public List<Post> getLatestPosts() {
        return postRepository.findTop10ByOrderByCreatedAtDesc();
    }

    @Transactional
    public void deletePost(Long postId, Long profileId) {
        Post post = getPostById(postId);
        validatePostOwnership(post, profileId);

        postRepository.delete(post);

        // Remove CV entries linked to this post
        cvUpdateService.removeCvEntriesByPostId(postId);
    }

    @Transactional
    public boolean toggleCelebratePost(Long postId) {
        Post post = getPostById(postId);
        User currentUser = getCurrentUser();

        // Check if user already has any reaction on this post
        Optional<Reaction> existingReaction = reactionRepository.findByPostAndUser(post, currentUser);

        if (existingReaction.isPresent() && existingReaction.get().getType() == ReactionType.CELEBRATE) {
            // Remove celebration
            reactionRepository.delete(existingReaction.get());

            // Remove notification
            notificationService.removePostCelebratedNotification(
                    post.getProfile().getUser().getId(),
                    currentUser.getId(),
                    postId);

            return false; // Post was uncelebrated
        } else {
            // Remove any existing reaction first (grief or celebrate)
            existingReaction.ifPresent(reactionRepository::delete);

            // Add celebration
            Reaction reaction = Reaction.builder()
                    .post(post)
                    .user(currentUser)
                    .type(ReactionType.CELEBRATE)
                    .build();

            reactionRepository.save(reaction);

            // Send notification to post owner
            notificationService.createPostCelebratedNotification(
                    post.getProfile().getUser().getId(),
                    currentUser.getId(),
                    currentUser.getName(),
                    postId);

            return true; // Post was celebrated
        }
    }

    @Transactional
    public void celebratePost(Long postId) {
        toggleCelebratePost(postId);
    }

    @Transactional(readOnly = true)
    public Long getCelebrationCount(Long postId) {
        Post post = getPostById(postId);
        return reactionRepository.findByPost(post).stream()
                .filter(reaction -> reaction.getType() == ReactionType.CELEBRATE)
                .count();
    }

    @Transactional(readOnly = true)
    public boolean isPostCelebratedByCurrentUser(Long postId) {
        Post post = getPostById(postId);
        User currentUser = getCurrentUser();
        Optional<Reaction> reaction = reactionRepository.findByPostAndUser(post, currentUser);
        return reaction.isPresent() && reaction.get().getType() == ReactionType.CELEBRATE;
    }

    @Transactional(readOnly = true)
    public List<Reaction> getPostReactions(Long postId) {
        Post post = getPostById(postId);
        return reactionRepository.findByPostWithUser(post);
    }

    @Transactional
    public boolean toggleGriefPost(Long postId) {
        Post post = getPostById(postId);
        User currentUser = getCurrentUser();

        // Check if user already grieved this post (specifically with GRIEF type)
        Optional<Reaction> existingReaction = reactionRepository.findByPostAndUser(post, currentUser);

        if (existingReaction.isPresent() && existingReaction.get().getType() == ReactionType.GRIEF) {
            // Remove grief
            reactionRepository.delete(existingReaction.get());

            // Remove notification
            notificationService.removePostGriefNotification(
                    post.getProfile().getUser().getId(),
                    currentUser.getId(),
                    postId);

            return false; // Post was ungriefed
        } else {
            // Remove any existing reaction first (celebrate or grief)
            existingReaction.ifPresent(reactionRepository::delete);

            // Add grief
            Reaction reaction = Reaction.builder()
                    .post(post)
                    .user(currentUser)
                    .type(ReactionType.GRIEF)
                    .build();

            reactionRepository.save(reaction);

            // Create notification
            notificationService.createPostGriefNotification(
                    post.getProfile().getUser().getId(),
                    currentUser.getId(),
                    currentUser.getUsername(),
                    postId);

            return true; // Post was grieved
        }
    }

    @Transactional(readOnly = true)
    public Long getGriefCount(Long postId) {
        Post post = getPostById(postId);
        return reactionRepository.findByPost(post).stream()
                .filter(reaction -> reaction.getType() == ReactionType.GRIEF)
                .count();
    }

    @Transactional(readOnly = true)
    public boolean isPostGriefedByCurrentUser(Long postId) {
        Post post = getPostById(postId);
        User currentUser = getCurrentUser();
        Optional<Reaction> reaction = reactionRepository.findByPostAndUser(post, currentUser);
        return reaction.isPresent() && reaction.get().getType() == ReactionType.GRIEF;
    }

    private Post savePost(String content, Profile profile, PostType type,
            List<String> tags, String cvHeading, boolean autoTagged,
            List<String> images) {
        return postRepository.save(Post.builder()
                .content(content)
                .type(type)
                .tags(tags)
                .cvHeading(cvHeading)
                .autoTagged(autoTagged)
                .profile(profile)
                .images(images != null ? new ArrayList<>(images) : new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
    }

    private void validatePostOwnership(Post post, Long profileId) {
        if (!post.getProfile().getId().equals(profileId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only modify your own posts");
        }
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<ReactionResponseDTO> convertReactionsToDto(List<Reaction> reactions) {
        return reactions.stream()
                .map(this::convertReactionToDto)
                .collect(Collectors.toList());
    }

    public ReactionResponseDTO convertReactionToDto(Reaction reaction) {
        return ReactionResponseDTO.builder()
                .id(reaction.getId())
                .type(reaction.getType())
                .userName(reaction.getUser().getName())
                .createdAt(reaction.getCreatedAt())
                .build();
    }

    @Transactional
    public Post manuallyEditPost(Long postId, Long profileId, String category, List<String> skills,
            String companyName, String position, String cvHeading) {
        // Verify ownership
        Post post = postRepository.findByIdAndProfileId(postId, profileId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Post not found or access denied"));

        Profile profile = profileService.getProfileById(profileId);
        PostType previousType = post.getType();

        // Convert category string to PostType
        PostType postType;
        List<String> tags = new ArrayList<>();
        String newCvHeading = post.getCvHeading(); // Keep existing heading by default

        switch (category.toUpperCase()) {
            case "ACHIEVEMENT":
                postType = PostType.ACHIEVEMENT;
                tags = skills != null ? new ArrayList<>(skills) : new ArrayList<>();
                // Use custom CV heading if provided, otherwise use default
                newCvHeading = (cvHeading != null && !cvHeading.trim().isEmpty()) ? cvHeading : "Achievement";
                break;

            case "PROJECT":
                postType = PostType.PROJECT;
                tags = skills != null ? new ArrayList<>(skills) : new ArrayList<>();
                // Use custom CV heading if provided, otherwise use default
                newCvHeading = (cvHeading != null && !cvHeading.trim().isEmpty()) ? cvHeading : "Project";
                break;

            case "PROFESSIONAL_EXPERIENCE":
                // For professional experience, create work entry and set post as GENERAL
                // (same logic as AI processing)
                if (companyName != null && position != null) {
                    // Create work entry from the provided data
                    createOrUpdateWorkEntry(profile, companyName, position);
                    newCvHeading = "Started " + position + " at " + companyName;
                }

                // Set post type to GENERAL to not show in CV (same as AI processing)
                postType = PostType.GENERAL;
                tags = new ArrayList<>(); // Clear tags since it's now GENERAL
                break;

            case "GENERAL":
                postType = PostType.GENERAL;
                tags = new ArrayList<>(); // Clear tags for general posts
                newCvHeading = "General Post";

                // Handle transitions from other categories to GENERAL
                if (previousType == PostType.EXPERIENCE) {
                    // If transitioning from work experience to general, delete the work entry
                    deleteWorkEntryFromPost(post, profile);
                    log.info("Deleted work entry for post {} transitioning from EXPERIENCE to GENERAL", postId);
                }
                break;

            default:
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Invalid category: " + category);
        }

        // Update the post
        post.setType(postType);
        post.setTags(tags);
        post.setCvHeading(newCvHeading);
        post.setAutoTagged(false); // Mark as manually tagged
        post.setUpdatedAt(LocalDateTime.now());

        Post savedPost = postRepository.save(post);

        // Handle CV updates based on the categorization
        if (category.toUpperCase().equals("PROFESSIONAL_EXPERIENCE") || category.toUpperCase().equals("GENERAL")) {
            // For professional experience or general, remove from CV
            cvUpdateService.removeCvEntriesByPostId(postId);
            log.info("Post {} converted to {} and removed from CV", postId, category);
        } else {
            // Update CV entries for other categories (ACHIEVEMENT, PROJECT)
            cvUpdateService.updateCvFromPost(savedPost);
        }

        log.info("Post {} manually edited to category: {}", postId, category);
        return savedPost;
    }

    private void createOrUpdateWorkEntry(Profile profile, String companyName, String position) {
        try {
            // Check if a work entry with this company and position already exists
            boolean workExists = profile.getWorks().stream()
                    .anyMatch(work -> work.getCompanyName().equalsIgnoreCase(companyName) &&
                            work.getPosition().equalsIgnoreCase(position));

            if (!workExists) {
                log.info("Creating new work entry for {} at {}", position, companyName);

                // Create WorkDto
                WorkDto workDto = WorkDto.builder()
                        .companyName(companyName)
                        .position(position)
                        .startDate(LocalDate.now()) // Use current date as start date
                        .endDate(null) // No end date as it's a new position
                        .isCurrent(true) // Assume it's current position
                        .build();

                // Get the user from profile
                User user = profile.getUser();
                if (user != null) {
                    // Create work entry using the work service
                    workService.createWork(workDto, user);
                    log.info("Successfully created work entry: {} at {}", position, companyName);
                } else {
                    log.warn("Could not find user for profile {}", profile.getId());
                }
            } else {
                log.info("Work entry already exists for {} at {}, skipping creation", position, companyName);
            }
        } catch (Exception e) {
            log.error("Failed to create work entry for {} at {}: {}", position, companyName, e.getMessage(), e);
        }
    }

    private void deleteWorkEntryFromPost(Post post, Profile profile) {
        try {
            // Extract company and position from post tags if available
            if (post.getTags() != null && !post.getTags().isEmpty()) {
                for (String tag : post.getTags()) {
                    // Tags format for experience: "Company,Position,Date"
                    String[] parts = tag.split(",");
                    if (parts.length >= 2) {
                        String companyName = parts[0].trim();
                        String position = parts[1].trim();

                        // Find and delete the work entry
                        profile.getWorks().removeIf(work -> work.getCompanyName().equalsIgnoreCase(companyName) &&
                                work.getPosition().equalsIgnoreCase(position));

                        log.info("Deleted work entry: {} at {}", position, companyName);
                        break; // Only delete the first matching entry
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to delete work entry for post {}: {}", post.getId(), e.getMessage(), e);
        }
    }

    private List<String> validateAndCleanImages(List<String> images) {
        if (images == null) {
            return new ArrayList<>();
        }

        List<String> validImages = new ArrayList<>();
        for (String image : images) {
            if (image != null && !image.trim().isEmpty()) {
                String cleanImage = image.trim();

                // Validate base64 format (basic check)
                if (isValidBase64Image(cleanImage)) {
                    validImages.add(cleanImage);
                } else {
                    log.warn("Invalid base64 image data provided, skipping");
                }
            }
        }

        if (validImages.size() > 4) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Maximum 4 images allowed per post");
        }

        return validImages;
    }

    private boolean isValidBase64Image(String image) {
        if (image == null || image.trim().isEmpty()) {
            return false;
        }

        // Check if it's a valid data URL format for images
        if (!image.startsWith("data:image/")) {
            return false;
        }

        // Check if it contains base64 marker
        if (!image.contains(";base64,")) {
            return false;
        }

        // Basic length check (should be substantial for a real image)
        return image.length() > 100;
    }
}