package com.example.postfolio.cvDownload.controller;

import com.example.postfolio.cvDownload.service.EnhancedCvGeneratorService;
import com.example.postfolio.profile.service.ProfileService;
import com.example.postfolio.post.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cv")
@RequiredArgsConstructor
public class CvController {

    private final ProfileService profileService;
    private final PostService postService;
    private final EnhancedCvGeneratorService enhancedCvGeneratorService;

    @GetMapping("/generate/{profileId}")
    public ResponseEntity<byte[]> generateCv(@PathVariable Long profileId) {
        try {
            byte[] pdfBytes = enhancedCvGeneratorService.generateCv(
                    profileService.getProfileById(profileId),
                    postService.getAllPostsByProfile(profileId));

            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", "attachment; filename=\"professional_cv.pdf\"")
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}