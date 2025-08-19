package com.example.postfolio.cvInApp.controller;

import com.example.postfolio.cvInApp.entity.CvEntry;
import com.example.postfolio.cvInApp.service.CvUpdateService;
import com.example.postfolio.post.dto.PostModalDTO;
import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.service.PostService;
import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.service.ProfileService;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.repository.UserRepository;
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
    private final UserRepository userRepository;

    @GetMapping("/entries/{profileId}")
    public ResponseEntity<List<CvEntry>> getCvEntries(@PathVariable Long profileId) {
        Profile profile = profileService.getProfileById(profileId);
        List<CvEntry> entries = cvUpdateService.getCvEntriesByProfile(profile);
        return ResponseEntity.ok(entries);
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<PostModalDTO> getPostByCvEntry(@PathVariable Long postId) {
        try {
            Post post = postService.getPostById(postId);
            Profile profile = post.getProfile();
            
            // Fetch user data separately to avoid lazy loading issues
            User user = userRepository.findById(profile.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Create DTO with all necessary information
            PostModalDTO dto = PostModalDTO.builder()
                .id(post.getId())
                .content(post.getContent())
                .cvHeading(post.getCvHeading())
                .type(post.getType())
                .tags(post.getTags())
                .images(post.getImages())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .autoTagged(post.getAutoTagged())
                .userName(user.getName())
                .userProfilePicture(profile.getPictureBase64())
                .userPosition(profile.getPositionOrInstitue())
                .userBio(profile.getBio())
                .build();
            
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            System.err.println("Error fetching post for modal: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    @DeleteMapping("/entries/post/{postId}")
    public ResponseEntity<Void> deleteEntriesByPostId(@PathVariable Long postId) {
        cvUpdateService.removeCvEntriesByPostId(postId);
        return ResponseEntity.noContent().build();
    }
}
