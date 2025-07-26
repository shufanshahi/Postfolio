package com.example.postfolio.post.controller;

import com.example.postfolio.post.dto.*;
import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.models.PostType;
import com.example.postfolio.post.service.PostService;
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

    // New endpoint for skill-based post retrieval
    @GetMapping("/profile/{profileId}/skills/{skill}")
    public ResponseEntity<List<PostResponseDTO>> getPostsBySkill(
            @PathVariable Long profileId,
            @PathVariable String skill) {
        List<Post> posts = postService.getPostsByTag(profileId, skill);
        return ResponseEntity.ok(convertToDtoList(posts));
    }

    // New endpoint for skill listing
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

    // New endpoint for reprocessing AI tags
    @PostMapping("/{postId}/retag")
    public ResponseEntity<PostResponseDTO> reprocessPostTags(
            @PathVariable Long postId,
            @RequestParam Long profileId) {
        Post post = postService.reprocessPostWithAI(postId, profileId);
        return ResponseEntity.ok(convertToDto(post));
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

    // DTO conversion methods
    private PostResponseDTO convertToDto(Post post) {
        return PostResponseDTO.builder()
                .id(post.getId())
                .content(post.getContent())
                .cvHeading(post.getCvHeading())
                .type(post.getType())
                .tags(post.getTags())
                .autoTagged(post.getAutoTagged())
                .profileId(post.getProfile().getId())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private List<PostResponseDTO> convertToDtoList(List<Post> posts) {
        return posts.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private Page<PostResponseDTO> convertToDtoPage(Page<Post> postPage) {
        List<PostResponseDTO> dtoList = postPage.getContent()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return new PageImpl<>(dtoList, postPage.getPageable(), postPage.getTotalElements());
    }
}