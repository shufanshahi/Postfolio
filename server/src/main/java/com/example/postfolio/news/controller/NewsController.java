package com.example.postfolio.news.controller;

import com.example.postfolio.news.service.NewsAccountService;
import com.example.postfolio.post.service.PostService;
import com.example.postfolio.profile.service.ProfileService;
import com.example.postfolio.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NewsController {

    private final NewsAccountService newsAccountService;
    private final PostService postService;
    private final ProfileService profileService;

    @PostMapping("/post")
    public ResponseEntity<?> createNewsPost(@RequestBody CreateNewsPostRequest request) {
        try {
            Optional<User> newsAccountOpt = newsAccountService.getNewsAccount();
            if (newsAccountOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "News account not found"));
            }

            var profile = profileService.getMyProfile();

            if (profile.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "News account profile not found"));
            }

            var post = postService.createPost(profile.get().getId(), request.getContent(), null);
            return ResponseEntity.ok(Map.of("message", "News post created successfully", "postId", post.getId()));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to create news post: " + e.getMessage()));
        }
    }

    @PostMapping("/init")
    public ResponseEntity<?> initializeNews() {
        try {
            newsAccountService.createNewsAccountIfNotExists();
            newsAccountService.makeAllUsersFollowNews();
            return ResponseEntity.ok(Map.of("message", "News account initialized successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to initialize news: " + e.getMessage()));
        }
    }

    public static class CreateNewsPostRequest {
        private String content;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
}
