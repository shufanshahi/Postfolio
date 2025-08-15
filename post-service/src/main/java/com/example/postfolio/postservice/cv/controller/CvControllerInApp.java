package com.example.postfolio.postservice.cv.controller;

import com.example.postfolio.postservice.cv.entity.CvEntry;
import com.example.postfolio.postservice.cv.service.CvUpdateService;
import com.example.postfolio.postservice.profile.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cv")
@RequiredArgsConstructor
public class CvControllerInApp {

    private final CvUpdateService cvUpdateService;
    private final ProfileRepository profileRepository;

    @GetMapping("/entries/{profileId}")
    public ResponseEntity<List<CvEntry>> getCvEntries(@PathVariable Long profileId) {
        var profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        List<CvEntry> entries = cvUpdateService.getCvEntriesByProfile(profile);
        return ResponseEntity.ok(entries);
    }

    @DeleteMapping("/entries/post/{postId}")
    public ResponseEntity<Void> deleteEntriesByPostId(@PathVariable Long postId) {
        cvUpdateService.removeCvEntriesByPostId(postId);
        return ResponseEntity.noContent().build();
    }
} 