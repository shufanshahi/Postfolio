package com.example.postfolio.follow.controller;

import com.example.postfolio.follow.service.FollowService;
import com.example.postfolio.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/follow")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FollowController {

    private final FollowService followService;

    @PostMapping("/{userId}")
    public ResponseEntity<Map<String, String>> followUser(@PathVariable Long userId) {
        try {
            followService.followUser(userId);
            return ResponseEntity.ok(Map.of("message", "Successfully followed user"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Map<String, String>> unfollowUser(@PathVariable Long userId) {
        try {
            followService.unfollowUser(userId);
            return ResponseEntity.ok(Map.of("message", "Successfully unfollowed user"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status/{userId}")
    public ResponseEntity<Map<String, Boolean>> getFollowStatus(@PathVariable Long userId) {
        try {
            boolean isFollowing = followService.isFollowing(userId);
            return ResponseEntity.ok(Map.of("isFollowing", isFollowing));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("isFollowing", false));
        }
    }

    @GetMapping("/following")
    public ResponseEntity<List<User>> getFollowing() {
        try {
            List<User> following = followService.getFollowing();
            return ResponseEntity.ok(following);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/followers")
    public ResponseEntity<List<User>> getFollowers() {
        try {
            List<User> followers = followService.getFollowers();
            return ResponseEntity.ok(followers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/count/followers/{userId}")
    public ResponseEntity<Map<String, Long>> getFollowerCount(@PathVariable Long userId) {
        try {
            long count = followService.getFollowerCount(userId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("count", 0L));
        }
    }

    @GetMapping("/count/following/{userId}")
    public ResponseEntity<Map<String, Long>> getFollowingCount(@PathVariable Long userId) {
        try {
            long count = followService.getFollowingCount(userId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("count", 0L));
        }
    }
}
