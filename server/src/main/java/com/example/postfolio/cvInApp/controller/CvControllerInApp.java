package com.example.postfolio.cvInApp.controller;

import com.example.postfolio.cvInApp.entity.CvEntry;
import com.example.postfolio.cvInApp.service.CvUpdateService;
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

    @GetMapping("/entries/{profileId}")
    public ResponseEntity<List<CvEntry>> getCvEntries(@PathVariable Long profileId) {
        Profile profile = profileService.getProfileById(profileId);
        List<CvEntry> entries = cvUpdateService.getCvEntriesByProfile(profile);
        return ResponseEntity.ok(entries);
    }

    @DeleteMapping("/entries/post/{postId}")
    public ResponseEntity<Void> deleteEntriesByPostId(@PathVariable Long postId) {
        cvUpdateService.removeCvEntriesByPostId(postId);
        return ResponseEntity.noContent().build();
    }
}
