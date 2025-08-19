package com.example.postfolio.cvInApp.controller;

import com.example.postfolio.cvInApp.entity.CvEntry;
import com.example.postfolio.cvInApp.service.CvUpdateService;
import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.service.PostService;
import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cv")
@RequiredArgsConstructor
public class CvControllerInApp {

    private final CvUpdateService cvUpdateService;
    private final ProfileService profileService;
    private final PostService postService;

    @GetMapping("/entries/{profileId}")
    public ResponseEntity<List<CvEntry>> getCvEntries(@PathVariable Long profileId) {
        Profile profile = profileService.getProfileById(profileId);
        List<CvEntry> entries = cvUpdateService.getCvEntriesByProfile(profile);
        return ResponseEntity.ok(entries);
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<Post> getPostByCvEntry(@PathVariable Long postId) {
        try {
            Post post = postService.getPostById(postId);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/entries/post/{postId}")
    public ResponseEntity<Void> deleteEntriesByPostId(@PathVariable Long postId) {
        cvUpdateService.removeCvEntriesByPostId(postId);
        return ResponseEntity.noContent().build();
    }
}
