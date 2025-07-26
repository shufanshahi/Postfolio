package com.example.postfolio.post.controller;

import com.example.postfolio.post.dto.CreatePostDTO;
import com.example.postfolio.post.dto.PostResponseDTO;
import com.example.postfolio.post.dto.UpdatePostDTO;
import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Validated
public class PostController {

    private final PostService postService;
    private final ModelMapper modelMapper = new ModelMapper();

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

    @GetMapping("/profile/{profileId}")
    public ResponseEntity<List<PostResponseDTO>> getProfilePosts(
            @PathVariable Long profileId) {
        List<Post> posts = postService.getAllPostsByProfile(profileId);
        return ResponseEntity.ok(convertToDtoList(posts));
    }

    @GetMapping("/profile/{profileId}/paginated")
    public ResponseEntity<Page<PostResponseDTO>> getPaginatedProfilePosts(
            @PathVariable Long profileId,
            Pageable pageable) {
        Page<Post> postPage = postService.getPaginatedPostsByProfile(profileId, pageable);
        return ResponseEntity.ok(convertToDtoPage(postPage));
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

    // Helper methods for DTO conversion
    private PostResponseDTO convertToDto(Post post) {
        return modelMapper.map(post, PostResponseDTO.class);
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