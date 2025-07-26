package com.example.postfolio.profile.controller;

import com.example.postfolio.profile.dto.ProfileRequest;
import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> createOrUpdateProfile(@ModelAttribute ProfileRequest request) {
        profileService.createOrUpdateProfile(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<Profile> getMyProfile() {
        return profileService.getMyProfile()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
