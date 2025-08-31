package com.example.postfolio.mentorship.controller;

import com.example.postfolio.mentorship.dto.*;
import com.example.postfolio.mentorship.service.MentorshipService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/mentorships")
@CrossOrigin(origins = "*")
public class MentorshipController {
    
    private final MentorshipService mentorshipService;
    
    @Autowired
    public MentorshipController(MentorshipService mentorshipService) {
        this.mentorshipService = mentorshipService;
    }
    
    /**
     * GET /api/mentorships - Get all mentorships
     */
    @GetMapping
    public ResponseEntity<List<MentorshipResponse>> getAllMentorships() {
        try {
            List<MentorshipResponse> mentorships = mentorshipService.getAllMentorships();
            return ResponseEntity.ok(mentorships);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/mentorships/profile/{profileId} - Get all mentorships by profile ID
     */
    @GetMapping("/profile/{profileId}")
    public ResponseEntity<List<MentorshipResponse>> getAllMentorshipsByProfileId(@PathVariable Long profileId) {
        try {
            List<MentorshipResponse> mentorships = mentorshipService.getAllMentorshipsByProfileId(profileId);
            return ResponseEntity.ok(mentorships);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/mentorships/{id} - Get mentorship by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<MentorshipResponse> getMentorshipById(@PathVariable Long id) {
        try {
            Optional<MentorshipResponse> mentorship = mentorshipService.getMentorshipById(id);
            return mentorship.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * POST /api/mentorships - Create a new mentorship
     */
    @PostMapping
    public ResponseEntity<MentorshipResponse> createMentorship(@Valid @RequestBody CreateMentorshipRequest request) {
        try {
            MentorshipResponse mentorship = mentorshipService.createMentorship(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(mentorship);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * POST /api/mentorships/{mentorshipId}/enroll - Enroll in a mentorship
     */
    @PostMapping("/{mentorshipId}/enroll")
    public ResponseEntity<MentorshipResponse> enrollInMentorship(
            @PathVariable Long mentorshipId, 
            @Valid @RequestBody EnrollMentorshipRequest request) {
        try {
            MentorshipResponse mentorship = mentorshipService.enrollInMentorship(mentorshipId, request);
            return ResponseEntity.ok(mentorship);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * PUT /api/mentorships/{mentorshipId}/repeat-status - Update repeat status
     */
    @PutMapping("/{mentorshipId}/repeat-status")
    public ResponseEntity<MentorshipResponse> updateRepeatStatus(
            @PathVariable Long mentorshipId, 
            @Valid @RequestBody UpdateRepeatStatusRequest request) {
        try {
            MentorshipResponse mentorship = mentorshipService.updateRepeatStatus(mentorshipId, request);
            return ResponseEntity.ok(mentorship);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * PUT /api/mentorships/{mentorshipId}/status - Update mentorship status
     */
    @PutMapping("/{mentorshipId}/status")
    public ResponseEntity<MentorshipResponse> updateStatus(
            @PathVariable Long mentorshipId, 
            @Valid @RequestBody UpdateStatusRequest request) {
        try {
            MentorshipResponse mentorship = mentorshipService.updateStatus(mentorshipId, request);
            return ResponseEntity.ok(mentorship);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/mentorships/active - Get all active mentorships
     */
    @GetMapping("/active")
    public ResponseEntity<List<MentorshipResponse>> getActiveMentorships() {
        try {
            List<MentorshipResponse> mentorships = mentorshipService.getActiveMentorships();
            return ResponseEntity.ok(mentorships);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/mentorships/enrolled/{profileId} - Get mentorships where profile is enrolled
     */
    @GetMapping("/enrolled/{profileId}")
    public ResponseEntity<List<MentorshipResponse>> getMentorshipsByEnrolledProfile(@PathVariable Long profileId) {
        try {
            List<MentorshipResponse> mentorships = mentorshipService.getMentorshipsByEnrolledProfile(profileId);
            return ResponseEntity.ok(mentorships);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * DELETE /api/mentorships/{mentorshipId} - Soft delete a mentorship
     */
    @DeleteMapping("/{mentorshipId}")
    public ResponseEntity<Void> deleteMentorship(@PathVariable Long mentorshipId) {
        try {
            mentorshipService.deleteMentorship(mentorshipId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/mentorships/{mentorshipId}/enrolled-count - Get enrolled profiles count
     */
    @GetMapping("/{mentorshipId}/enrolled-count")
    public ResponseEntity<Integer> getEnrolledProfilesCount(@PathVariable Long mentorshipId) {
        try {
            Integer count = mentorshipService.getEnrolledProfilesCount(mentorshipId);
            return ResponseEntity.ok(count);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
