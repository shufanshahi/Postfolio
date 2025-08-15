package com.example.postfolio.postservice.cv.controller;

import com.example.postfolio.postservice.cv.service.CvGeneratorService;
import com.example.postfolio.postservice.profile.repository.ProfileRepository;
import com.example.postfolio.postservice.post.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cv")
@RequiredArgsConstructor
public class CvController {

    private final ProfileRepository profileRepository;
    private final PostService postService;
    private final CvGeneratorService cvGeneratorService;

    @GetMapping("/generate/{profileId}")
    public ResponseEntity<byte[]> generateCv(@PathVariable Long profileId) {
        try {
            var profile = profileRepository.findById(profileId)
                    .orElseThrow(() -> new RuntimeException("Profile not found"));
            
            var posts = postService.getAllPostsByProfile(profileId);
            
            byte[] pdfBytes = cvGeneratorService.generateCv(profile, posts);

            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", "attachment; filename=\"cv.pdf\"")
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
} 