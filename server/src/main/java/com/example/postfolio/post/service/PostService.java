package com.example.postfolio.post.service;

import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.repository.PostRepository;
import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final ProfileService profileService;

    @Transactional
    public Post createPost(Long profileId, String content) {
        Profile profile = profileService.getProfileById(profileId);

        Post post = Post.builder()
                .content(content)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .profile(profile)
                .build();

        return postRepository.save(post);
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

    @Transactional
    public Post updatePost(Long postId, Long profileId, String newContent) {
        Post post = getPostById(postId);
        validatePostOwnership(post, profileId);

        post.setContent(newContent);
        post.setUpdatedAt(LocalDateTime.now());
        return postRepository.save(post);
    }

    @Transactional
    public void deletePost(Long postId, Long profileId) {
        Post post = getPostById(postId);
        validatePostOwnership(post, profileId);
        postRepository.delete(post);
    }

    @Transactional(readOnly = true)
    public List<Post> getLatestPosts() {
        return postRepository.findTop10ByOrderByCreatedAtDesc();
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