package com.example.postfolio.postservice.post.service;

import com.example.postfolio.postservice.post.dto.CreatePostDTO;
import com.example.postfolio.postservice.post.dto.GeminiResponse;
import com.example.postfolio.postservice.post.dto.PostResponseDTO;
import com.example.postfolio.postservice.post.dto.ReactionResponseDTO;
import com.example.postfolio.postservice.post.dto.UpdatePostDTO;
import com.example.postfolio.postservice.post.entity.Post;
import com.example.postfolio.postservice.post.entity.Reaction;
import com.example.postfolio.postservice.post.model.ReactionType;
import com.example.postfolio.postservice.post.models.PostType;
import com.example.postfolio.postservice.post.repository.PostRepository;
import com.example.postfolio.postservice.post.repository.ReactionRepository;
import com.example.postfolio.postservice.profile.entity.Profile;
import com.example.postfolio.postservice.profile.repository.ProfileRepository;
import com.example.postfolio.postservice.user.entity.User;
import com.example.postfolio.postservice.user.repository.UserRepository;
import com.example.postfolio.postservice.cv.service.CvUpdateService;
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
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final ProfileRepository profileRepository;
    private final GeminiService geminiService;
    private final UserRepository userRepository;
    private final ReactionRepository reactionRepository;
    private final CvUpdateService cvUpdateService;

    @Transactional
    public Post createPost(Long profileId, String content) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        
        try {
            GeminiResponse analysis = geminiService.analyzePost(content);
            Post savedPost = savePost(content, profile, analysis.getPostType(), 
                                    analysis.getTags(), analysis.getPostType().toString(), true);
            cvUpdateService.updateCvFromPost(savedPost);
            return savedPost;
        } catch (Exception e) {
            log.error("Failed to generate CV heading for post, using fallback", e);
            Post savedPost = savePost(content, profile, null, 
                                    List.of(), generateFallbackCvHeading(content), false);
            cvUpdateService.updateCvFromPost(savedPost);
            return savedPost;
        }
    }

    @Transactional(readOnly = true)
    public List<String> getProfileSkills(Long profileId) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
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
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        return postRepository.findByProfileOrderByCreatedAtDesc(profile);
    }

    @Transactional(readOnly = true)
    public Page<Post> getPaginatedPostsByProfile(Long profileId, Pageable pageable) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        return postRepository.findByProfile(profile, pageable);
    }

    @Transactional(readOnly = true)
    public List<Post> getPostsByType(Long profileId, PostType type) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        return postRepository.findByProfileAndTypeOrderByCreatedAtDesc(profile, type);
    }

    @Transactional(readOnly = true)
    public List<Post> getPostsByTag(Long profileId, String tag) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        return postRepository.findByProfileAndTagsContaining(profile, tag);
    }

    @Transactional(readOnly = true)
    public List<Post> getFeedPosts(Long profileId) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        // Simplified feed - only returns current user's posts
        // In a full microservice setup, this would call the connection service
        return postRepository.findByProfileOrderByCreatedAtDesc(profile);
    }

    @Transactional
    public Post updatePost(Long postId, Long profileId, String newContent) {
        Post post = getPostById(postId);
        validatePostOwnership(post, profileId);
        post.setContent(newContent);

        try {
            GeminiResponse analysis = geminiService.analyzePost(newContent);
            post.setCvHeading(analysis.getPostType().toString());
            post.setType(analysis.getPostType());
            post.setTags(analysis.getTags());
        } catch (Exception e) {
            log.error("Failed to generate CV heading for updated post, using fallback", e);
            post.setCvHeading(generateFallbackCvHeading(newContent));
        }

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
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
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

    @Transactional
    public void celebratePost(Long postId, Long profileId) {
        Post post = getPostById(postId);
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        User user = profile.getUser();
        
        if (reactionRepository.existsByPostAndUser(post, user)) {
            throw new RuntimeException("User already celebrated this post");
        }
        
        Reaction reaction = Reaction.builder()
                .post(post)
                .user(user)
                .type(ReactionType.CELEBRATE)
                .build();
        
        reactionRepository.save(reaction);
    }

    @Transactional(readOnly = true)
    public List<Reaction> getPostReactions(Long postId) {
        Post post = getPostById(postId);
        return reactionRepository.findByPostWithUser(post);
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

    private void validatePostOwnership(Post post, Long profileId) {
        if (!post.getProfile().getId().equals(profileId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only modify your own posts"
            );
        }
    }

    private String generateFallbackCvHeading(String content) {
        return content.length() > 50 ? content.substring(0, 50) + "..." : content;
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
} 