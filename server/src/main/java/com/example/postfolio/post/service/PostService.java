package com.example.postfolio.post.service;

import com.example.postfolio.cvInApp.service.CvUpdateService;
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
    private final CvUpdateService cvUpdateService;  // Inject CV update service

    @Transactional
    public Post createPost(Long profileId, String content) {
        Profile profile = profileService.getProfileById(profileId);

        try {
            GeminiService.GeminiResponse analysis = geminiService.analyzePost(content);
            Post savedPost = savePost(
                    content,
                    profile,
                    analysis.getPostType(),
                    analysis.getTags(),
                    analysis.getSummary(),
                    true
            );

            cvUpdateService.updateCvFromPost(savedPost);  // Update CV after post creation

            return savedPost;
        } catch (Exception e) {
            log.error("AI analysis failed for post content: {}. Error: {}", content, e.getMessage());
            Post savedPost = savePost(
                    content,
                    profile,
                    PostType.SKILL,
                    List.of("General"),
                    generateFallbackCvHeading(content),
                    false
            );

            cvUpdateService.updateCvFromPost(savedPost);  // Update CV after fallback post creation

            return savedPost;
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
            post.setCvHeading(analysis.getSummary());
            post.setAutoTagged(true);
            post.setUpdatedAt(LocalDateTime.now());
            Post savedPost = postRepository.save(post);

            cvUpdateService.updateCvFromPost(savedPost);  // Update CV after reprocessing

            return savedPost;
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

        try {
            GeminiService.GeminiResponse analysis = geminiService.analyzePost(newContent);
            post.setCvHeading(analysis.getSummary());
            post.setType(analysis.getPostType());
            post.setTags(analysis.getTags());
        } catch (Exception e) {
            log.error("Failed to generate CV heading for updated post, using fallback", e);
            post.setCvHeading(generateFallbackCvHeading(newContent));
        }

        post.setUpdatedAt(LocalDateTime.now());
        post.setAutoTagged(false);

        Post savedPost = postRepository.save(post);

        cvUpdateService.updateCvFromPost(savedPost);  // Update CV after post update

        return savedPost;
    }

    @Transactional
    public Post updatePostTags(Long postId, Long profileId, List<String> tags) {
        Post post = getPostById(postId);
        validatePostOwnership(post, profileId);
        post.setTags(tags);
        post.setUpdatedAt(LocalDateTime.now());
        post.setAutoTagged(false);

        Post savedPost = postRepository.save(post);

        cvUpdateService.updateCvFromPost(savedPost);  // Update CV after tags update

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

    private Post savePost(String content, Profile profile, PostType type,
                          List<String> tags, String cvHeading, boolean autoTagged) {
        return postRepository.save(Post.builder()
                .content(content)
                .type(type)
                .tags(tags)
                .cvHeading(cvHeading)
                .autoTagged(autoTagged)
                .profile(profile)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());
    }

    private String generateFallbackCvHeading(String content) {
        if (content == null || content.isEmpty()) {
            return "Untitled Post";
        }

        // Try to use the first complete sentence
        int sentenceEnd = content.indexOf('.');
        if (sentenceEnd > 0 && sentenceEnd <= 100) {
            return content.substring(0, sentenceEnd).trim();
        }

        // Try to find a natural break point near 50 characters
        if (content.length() > 50) {
            int lastSpace = content.lastIndexOf(' ', 50);
            if (lastSpace > 30) {
                return content.substring(0, lastSpace).trim() + "...";
            }
            return content.substring(0, 47).trim() + "...";
        }
        return content;
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
