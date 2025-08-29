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
    private final CvUpdateService cvUpdateService;
    private final UserRepository userRepository;
    private final ReactionRepository reactionRepository;
    private final NotificationService notificationService;
    private final AIServiceManager aiServiceManager;

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

        // Save post immediately with default values for fast response (200ms)
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

    @Transactional
    public Post reprocessPostWithAI(Long postId, Long profileId) {
        Post post = getPostById(postId);
        validatePostOwnership(post, profileId);
        Profile profile = post.getProfile();

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

        // Update post content and images immediately
        post.setContent(newContent);
        post.setImages(images != null ? new ArrayList<>(images) : new ArrayList<>());
        post.setCvHeading("Processing...");
        post.setAutoTagged(false);
        post.setUpdatedAt(LocalDateTime.now());

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