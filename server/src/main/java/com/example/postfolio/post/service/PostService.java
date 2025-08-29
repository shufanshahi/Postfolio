package com.example.postfolio.post.service;

import com.example.postfolio.cvInApp.service.CvUpdateService;
import com.example.postfolio.notification.service.NotificationService;
import com.example.postfolio.post.dto.CreatePostDTO;
import com.example.postfolio.post.dto.PostResponseDTO;
import com.example.postfolio.post.dto.UpdatePostDTO;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
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
    private final GeminiService geminiService;
    private final CvUpdateService cvUpdateService;
    private final UserRepository userRepository;
    private final ReactionRepository reactionRepository;
    private final NotificationService notificationService;
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

        try {
            GeminiService.GeminiResponse analysis = geminiService.analyzePost(content);
            
            // Handle EXPERIENCE type specially
            if (analysis.getPostType() == PostType.EXPERIENCE) {
                // Create work entry from tags
                createWorkFromExperiencePost(analysis);
                
                // Save post as GENERAL to not show in CV
                Post savedPost = savePost(content, profile, PostType.GENERAL,
                        List.of(), analysis.getSummary(), true, images);
                
                return savedPost;
            } else {
                // Normal flow for other post types
                Post savedPost = savePost(content, profile, analysis.getPostType(),
                        analysis.getTags(), analysis.getSummary(), true, images);

                // Only update CV if the post is CV-relevant (not GENERAL)
                if (analysis.isCvRelevant()) {
                    cvUpdateService.updateCvFromPost(savedPost);
                }

                return savedPost;
            }
        } catch (Exception e) {
            log.error("Failed to generate CV heading for post, using fallback", e);
            Post savedPost = savePost(content, profile, PostType.GENERAL,
                    List.of(), generateFallbackCvHeading(content), false, images);

            return savedPost;
        }
    }

    @Transactional
    public Post reprocessPostWithAI(Long postId, Long profileId) {
        Post post = getPostById(postId);
        validatePostOwnership(post, profileId);

        try {
            GeminiService.GeminiResponse analysis = geminiService.analyzePost(post.getContent());
            
            // Handle EXPERIENCE type specially
            if (analysis.getPostType() == PostType.EXPERIENCE) {
                // Create work entry from tags
                createWorkFromExperiencePost(analysis);
                
                // Update post as GENERAL to not show in CV
                post.setType(PostType.GENERAL);
                post.setTags(List.of());
                post.setCvHeading(analysis.getSummary());
                post.setAutoTagged(true);
                post.setUpdatedAt(LocalDateTime.now());
                
                // Remove from CV if it was there
                cvUpdateService.removeCvEntriesByPostId(postId);
                
                return postRepository.save(post);
            } else {
                // Normal flow for other post types
                post.setType(analysis.getPostType());
                post.setTags(analysis.getTags());
                post.setCvHeading(analysis.getSummary());
                post.setAutoTagged(true);
                post.setUpdatedAt(LocalDateTime.now());
                Post savedPost = postRepository.save(post);

                // Only update CV if the post is CV-relevant
                if (analysis.isCvRelevant()) {
                    cvUpdateService.updateCvFromPost(savedPost);
                } else {
                    // If post was previously CV-relevant but now classified as GENERAL,
                    // remove it from CV
                    cvUpdateService.removeCvEntriesByPostId(postId);
                }

                return savedPost;
            }
        } catch (Exception e) {
            log.error("Failed to reprocess post {} with AI: {}", postId, e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to reprocess post with AI");
        }
    }

    @Transactional
    public Post updatePost(Long postId, Long profileId, String newContent, List<String> images) {
        Post post = getPostById(postId);
        validatePostOwnership(post, profileId);
        PostType previousType = post.getType();

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

        post.setContent(newContent);
        post.setImages(images != null ? new ArrayList<>(images) : new ArrayList<>());

        try {
            GeminiService.GeminiResponse analysis = geminiService.analyzePost(newContent);
            
            // Handle EXPERIENCE type specially
            if (analysis.getPostType() == PostType.EXPERIENCE) {
                // Create work entry from tags
                createWorkFromExperiencePost(analysis);
                
                // Update post as GENERAL to not show in CV
                post.setType(PostType.GENERAL);
                post.setTags(List.of());
                post.setCvHeading(analysis.getSummary());
                post.setUpdatedAt(LocalDateTime.now());
                post.setAutoTagged(false);
                
                // Remove from CV if it was there
                if (previousType != PostType.GENERAL) {
                    cvUpdateService.removeCvEntriesByPostId(postId);
                }
                
                return postRepository.save(post);
            } else {
                // Normal flow for other post types
                post.setCvHeading(analysis.getSummary());
                post.setType(analysis.getPostType());
                post.setTags(analysis.getTags());
                post.setUpdatedAt(LocalDateTime.now());
                post.setAutoTagged(false);

                Post savedPost = postRepository.save(post);

                // Handle CV updates based on post type changes
                if (analysis.isCvRelevant()) {
                    cvUpdateService.updateCvFromPost(savedPost);
                } else if (previousType != PostType.GENERAL) {
                    // Post was CV-relevant before but now is GENERAL, remove from CV
                    cvUpdateService.removeCvEntriesByPostId(postId);
                }

                return savedPost;
            }
        } catch (Exception e) {
            log.error("Failed to generate CV heading for updated post, using fallback", e);
            post.setCvHeading(generateFallbackCvHeading(newContent));
            post.setType(PostType.GENERAL); // Fallback to GENERAL
            post.setTags(List.of());

            post.setUpdatedAt(LocalDateTime.now());
            post.setAutoTagged(false);

            Post savedPost = postRepository.save(post);

            // Remove from CV since we're treating it as GENERAL
            if (previousType != PostType.GENERAL) {
                cvUpdateService.removeCvEntriesByPostId(postId);
            }

            return savedPost;
        }
    }

    /**
     * Creates a Work entry from EXPERIENCE post analysis
     * Expected tags format: "Company Name,Position,Date" or "Company Name,Position,none"
     */
    private void createWorkFromExperiencePost(GeminiService.GeminiResponse analysis) {
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

            // Get current user
            User currentUser = getCurrentUser();
            
            // Create WorkDto
            WorkDto workDto = WorkDto.builder()
                    .companyName(companyName)
                    .position(position)
                    .startDate(startDate)
                    .endDate(null) // No end date as it's a new position
                    .isCurrent(true) // Assume it's current position
                    .build();
            
            // Create work entry
            workService.createWork(workDto, currentUser);
            log.info("Created work entry: {} at {}", position, companyName);
            
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

        // Check if user already celebrated this post
        if (reactionRepository.existsByPostAndUser(post, currentUser)) {
            // Remove celebration
            reactionRepository.deleteByPostAndUser(post, currentUser);

            // Remove notification
            notificationService.removePostCelebratedNotification(
                    post.getProfile().getUser().getId(),
                    currentUser.getId(),
                    postId);

            return false; // Post was uncelebrated
        } else {
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
        return reactionRepository.existsByPostAndUser(post, currentUser);
    }

    @Transactional(readOnly = true)
    public List<Reaction> getPostReactions(Long postId) {
        Post post = getPostById(postId);
        return reactionRepository.findByPostWithUser(post);
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

    private String generateFallbackCvHeading(String content) {
        return content.length() > 50 ? content.substring(0, 50) + "..." : content;
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