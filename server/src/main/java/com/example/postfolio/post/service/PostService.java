package com.example.postfolio.post.service;

import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.models.PostType;
import com.example.postfolio.post.repository.PostRepository;
import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final ProfileService profileService;
    private final GeminiService geminiService;

    @Transactional
    public Post createPost(Long profileId, String content) {
        Profile profile = profileService.getProfileById(profileId);

        try {
            GeminiService.GeminiResponse analysis = geminiService.analyzePost(content);
            return savePost(
                    content,
                    profile,
                    analysis.getPostType(),
                    analysis.getTags(),
                    true
            );
        } catch (Exception e) {
            log.error("AI analysis failed for post content: {}. Error: {}", content, e.getMessage());
            return savePost(
                    content,
                    profile,
                    PostType.SKILL,
                    List.of("General"),
                    false
            );
        }
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    @Transactional
    public Post reprocessPostWithAI(Long postId, Long profileId) {
        Post post = getPostById(postId);
        validatePostOwnership(post, profileId);

        try {
            GeminiService.GeminiResponse analysis = geminiService.analyzePost(post.getContent());
            post.setType(analysis.getPostType());
            post.setTags(analysis.getTags());
            post.setCvHeading(generateCvHeading(post.getContent()));
            post.setAutoTagged(true);
            post.setUpdatedAt(LocalDateTime.now());
            return postRepository.save(post);
        } catch (Exception e) {
            log.error("Failed to reprocess post {} with AI: {}", postId, e.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to reprocess post with AI"
            );
        }
    }

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
                        "Post not found with id: " + postId
                ));
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

    @Transactional
    public Post updatePost(Long postId, Long profileId, String newContent) {
        Post post = getPostById(postId);
        validatePostOwnership(post, profileId);
        post.setContent(newContent);
        post.setCvHeading(generateCvHeading(newContent)); // Update cv_heading too
        post.setUpdatedAt(LocalDateTime.now());
        post.setAutoTagged(false);
        return postRepository.save(post);
    }

    @Transactional
    public Post updatePostTags(Long postId, Long profileId, List<String> tags) {
        Post post = getPostById(postId);
        validatePostOwnership(post, profileId);
        post.setTags(tags);
        post.setUpdatedAt(LocalDateTime.now());
        post.setAutoTagged(false);
        return postRepository.save(post);
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
    }

    private Post savePost(String content, Profile profile, PostType type,
                          List<String> tags, boolean autoTagged) {
        return postRepository.save(Post.builder()
                .content(content)
                .type(type)
                .tags(tags)
                .cvHeading(generateCvHeading(content))
                .autoTagged(autoTagged)
                .profile(profile)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
    }

    private String generateCvHeading(String content) {
        return content.length() > 50
                ? content.substring(0, 47) + "..."
                : content;
    }

    private void validatePostOwnership(Post post, Long profileId) {
        if (!post.getProfile().getId().equals(profileId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You don't have permission to modify this post"
            );
        }
    }
}