package com.example.postfolio.news.controller;

import com.example.postfolio.news.service.AutomatedNewsService;
import com.example.postfolio.news.service.NewsAccountService;
import com.example.postfolio.post.service.PostService;
import com.example.postfolio.profile.service.ProfileService;
import com.example.postfolio.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Slf4j
@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NewsController {

    private final AutomatedNewsService automatedNewsService;
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

    @PostMapping("/test-auto-post")
    public ResponseEntity<?> testAutomatedNewsPosting() {
        log.info("Manual test automated news posting endpoint called");
        
        try {
            CompletableFuture<String> result = automatedNewsService.testNewsPosting();
            String message = result.get(); // Get the result synchronously for simpler response
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", message,
                "timestamp", System.currentTimeMillis()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Failed to post automated news: " + e.getMessage(),
                "timestamp", System.currentTimeMillis()
            ));
        }
    }

    @GetMapping("/auto-status")
    public ResponseEntity<Map<String, Object>> getAutomatedNewsServiceStatus() {
        return ResponseEntity.ok(Map.of(
            "service", "AutomatedNewsService",
            "status", "running",
            "schedule", "Every hour (0 minutes of each hour)",
            "description", "Fetches job market news from NewsAPI and posts via News account",
            "manual_test_endpoint", "/api/news/test-auto-post",
            "timestamp", System.currentTimeMillis()
        ));
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
