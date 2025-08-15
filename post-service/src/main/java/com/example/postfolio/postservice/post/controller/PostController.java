package com.example.postfolio.postservice.post.controller;

import com.example.postfolio.postservice.post.dto.*;
import com.example.postfolio.postservice.post.entity.Post;
import com.example.postfolio.postservice.post.entity.Reaction;
import com.example.postfolio.postservice.post.models.PostType;
import com.example.postfolio.postservice.post.repository.ReactionRepository;
import com.example.postfolio.postservice.post.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;
    private final ReactionRepository reactionRepository;

    @PostMapping
    public ResponseEntity<PostResponseDTO> createPost(
            @RequestBody @Valid CreatePostDTO createPostDTO) {
        Post post = postService.createPost(
                createPostDTO.getProfileId(),
                createPostDTO.getContent()
        );
        return ResponseEntity.ok(convertToDto(post));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<PostResponseDTO> getPost(
            @PathVariable Long postId) {
        Post post = postService.getPostById(postId);
        return ResponseEntity.ok(convertToDto(post));
    }

    @GetMapping("/profile/{profileId}/skills/{skill}")
    public ResponseEntity<List<PostResponseDTO>> getPostsBySkill(
            @PathVariable Long profileId,
            @PathVariable String skill) {
        List<Post> posts = postService.getPostsByTag(profileId, skill);
        return ResponseEntity.ok(convertToDtoList(posts));
    }

    @GetMapping("/profile/{profileId}/skills")
    public ResponseEntity<List<String>> getProfileSkills(
            @PathVariable Long profileId) {
        List<String> skills = postService.getProfileSkills(profileId);
        return ResponseEntity.ok(skills);
    }

    @GetMapping("/profile/{profileId}")
    public ResponseEntity<List<PostResponseDTO>> getProfilePosts(
            @PathVariable Long profileId) {
        List<Post> posts = postService.getAllPostsByProfile(profileId);
        return ResponseEntity.ok(convertToDtoList(posts));
    }

    @GetMapping("/profile/{profileId}/type/{type}")
    public ResponseEntity<List<PostResponseDTO>> getPostsByType(
            @PathVariable Long profileId,
            @PathVariable PostType type) {
        List<Post> posts = postService.getPostsByType(profileId, type);
        return ResponseEntity.ok(convertToDtoList(posts));
    }

    @GetMapping("/profile/{profileId}/paginated")
    public ResponseEntity<Page<PostResponseDTO>> getPaginatedProfilePosts(
            @PathVariable Long profileId,
            Pageable pageable) {
        Page<Post> postPage = postService.getPaginatedPostsByProfile(profileId, pageable);
        return ResponseEntity.ok(convertToDtoPage(postPage));
    }

    @GetMapping("/profile/{profileId}/needs-review")
    public ResponseEntity<Page<PostResponseDTO>> getPostsNeedingReview(
            @PathVariable Long profileId,
            Pageable pageable) {
        Page<Post> posts = postService.getPostsNeedingReview(profileId, pageable);
        return ResponseEntity.ok(convertToDtoPage(posts));
    }

    @GetMapping("/feed")
    public ResponseEntity<List<PostResponseDTO>> getFeedPosts() {
        List<Post> posts = postService.getFeedPosts();
        return ResponseEntity.ok(convertToDtoList(posts));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<PostResponseDTO> updatePost(
            @PathVariable Long postId,
            @RequestBody @Valid UpdatePostDTO updatePostDTO) {
        Post post = postService.updatePost(
                postId,
                updatePostDTO.getProfileId(),
                updatePostDTO.getContent()
        );
        return ResponseEntity.ok(convertToDto(post));
    }

    @PutMapping("/{postId}/tags")
    public ResponseEntity<PostResponseDTO> updatePostTags(
            @PathVariable Long postId,
            @RequestBody @Valid TagUpdateDTO tagUpdateDTO) {
        Post post = postService.updatePostTags(
                postId,
                tagUpdateDTO.getProfileId(),
                tagUpdateDTO.getTags()
        );
        return ResponseEntity.ok(convertToDto(post));
    }

    @PostMapping("/{postId}/celebrate")
    public ResponseEntity<Void> celebratePost(@PathVariable Long postId) {
        postService.celebratePost(postId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{postId}/reactions")
    public ResponseEntity<List<ReactionResponseDTO>> getPostReactions(@PathVariable Long postId) {
        List<Reaction> reactions = postService.getPostReactions(postId);
        return ResponseEntity.ok(postService.convertReactionsToDto(reactions));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long postId,
            @RequestParam Long profileId) {
        postService.deletePost(postId, profileId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/latest")
    public ResponseEntity<List<PostResponseDTO>> getLatestPosts() {
        List<Post> posts = postService.getLatestPosts();
        return ResponseEntity.ok(convertToDtoList(posts));
    }

    private PostResponseDTO convertToDto(Post post) {
        List<Reaction> reactions = reactionRepository.findByPostWithUser(post);
        List<ReactionResponseDTO> reactionDtos = postService.convertReactionsToDto(reactions);
        
        return PostResponseDTO.builder()
                .id(post.getId())
                .content(post.getContent())
                .type(post.getType())
                .tags(post.getTags())
                .cvHeading(post.getCvHeading())
                .autoTagged(post.getAutoTagged())
                .profileId(post.getProfile().getId())
                .profileName(post.getProfile().getUser().getName())
                .profilePictureBase64(post.getProfile().getPictureBase64())
                .createdAt(post.getCreatedAt())
                .reactions(reactionDtos)
                .build();
    }

    private List<PostResponseDTO> convertToDtoList(List<Post> posts) {
        return posts.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private Page<PostResponseDTO> convertToDtoPage(Page<Post> postPage) {
        List<PostResponseDTO> dtoList = convertToDtoList(postPage.getContent());
        return new PageImpl<>(dtoList, postPage.getPageable(), postPage.getTotalElements());
    }
} 