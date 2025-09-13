package com.example.postfolio.enrollments.controller;

import com.example.postfolio.enrollments.dto.*;
import com.example.postfolio.enrollments.entity.Enrollment;
import com.example.postfolio.enrollments.service.EnrollmentService;
import com.example.postfolio.enrollments.service.EnrollmentStatusSchedulerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {
    
    private final EnrollmentService enrollmentService;
    private final EnrollmentStatusSchedulerService schedulerService;
    
    @Autowired
    public EnrollmentController(EnrollmentService enrollmentService, 
                              EnrollmentStatusSchedulerService schedulerService) {
        this.enrollmentService = enrollmentService;
        this.schedulerService = schedulerService;
    }
    
    /**
     * GET /api/enrollments - Get all enrollments
     */
    @GetMapping
    public ResponseEntity<List<EnrollmentResponse>> getAllEnrollments() {
        try {
            List<EnrollmentResponse> enrollments = enrollmentService.getAllEnrollments();
            return ResponseEntity.ok(enrollments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/enrollments/profile/{profileId} - Get all enrollments by profile ID
     */
    @GetMapping("/profile/{profileId}")
    public ResponseEntity<List<EnrollmentResponse>> getAllEnrollmentsByProfileId(@PathVariable Long profileId) {
        try {
            List<EnrollmentResponse> enrollments = enrollmentService.getAllEnrollmentsByProfileId(profileId);
            return ResponseEntity.ok(enrollments);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/enrollments/mentorship/{mentorshipId} - Get all enrollments by mentorship ID
     */
    @GetMapping("/mentorship/{mentorshipId}")
    public ResponseEntity<List<EnrollmentResponse>> getAllEnrollmentsByMentorshipId(@PathVariable Long mentorshipId) {
        try {
            List<EnrollmentResponse> enrollments = enrollmentService.getAllEnrollmentsByMentorshipId(mentorshipId);
            return ResponseEntity.ok(enrollments);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * POST /api/enrollments - Create a new enrollment
     */
    @PostMapping
    public ResponseEntity<EnrollmentResponse> createEnrollment(@Valid @RequestBody CreateEnrollmentRequest request) {
        try {
            EnrollmentResponse enrollment = enrollmentService.createEnrollment(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(enrollment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/enrollments/{id} - Get enrollment by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<EnrollmentResponse> getEnrollmentById(@PathVariable Long id) {
        try {
            Optional<EnrollmentResponse> enrollment = enrollmentService.getEnrollmentById(id);
            return enrollment.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * PUT /api/enrollments/{id}/status - Update enrollment status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<EnrollmentResponse> updateEnrollmentStatus(
            @PathVariable Long id, 
            @Valid @RequestBody UpdateEnrollmentStatusRequest request) {
        try {
            EnrollmentResponse enrollment = enrollmentService.updateEnrollmentStatus(id, request);
            return ResponseEntity.ok(enrollment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * PUT /api/enrollments/{id}/rating - Update enrollment rating
     */
    @PutMapping("/{id}/rating")
    public ResponseEntity<EnrollmentResponse> updateEnrollmentRating(
            @PathVariable Long id, 
            @Valid @RequestBody UpdateEnrollmentRatingRequest request) {
        try {
            EnrollmentResponse enrollment = enrollmentService.updateEnrollmentRating(id, request);
            return ResponseEntity.ok(enrollment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * DELETE /api/enrollments/{id} - Delete enrollment
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEnrollment(@PathVariable Long id) {
        try {
            enrollmentService.deleteEnrollment(id);
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
     * GET /api/enrollments/profile/{profileId}/status/{status} - Get enrollments by profile ID and status
     */
    @GetMapping("/profile/{profileId}/status/{status}")
    public ResponseEntity<List<EnrollmentResponse>> getEnrollmentsByProfileIdAndStatus(
            @PathVariable Long profileId, 
            @PathVariable String status) {
        try {
            Enrollment.EnrollmentStatus enrollmentStatus = Enrollment.EnrollmentStatus.valueOf(status.toUpperCase());
            List<EnrollmentResponse> enrollments = enrollmentService.getEnrollmentsByProfileIdAndStatus(profileId, enrollmentStatus);
            return ResponseEntity.ok(enrollments);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/enrollments/mentorship/{mentorshipId}/status/{status} - Get enrollments by mentorship ID and status
     */
    @GetMapping("/mentorship/{mentorshipId}/status/{status}")
    public ResponseEntity<List<EnrollmentResponse>> getEnrollmentsByMentorshipIdAndStatus(
            @PathVariable Long mentorshipId, 
            @PathVariable String status) {
        try {
            Enrollment.EnrollmentStatus enrollmentStatus = Enrollment.EnrollmentStatus.valueOf(status.toUpperCase());
            List<EnrollmentResponse> enrollments = enrollmentService.getEnrollmentsByMentorshipIdAndStatus(mentorshipId, enrollmentStatus);
            return ResponseEntity.ok(enrollments);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/enrollments/check/{profileId}/{mentorshipId} - Check if profile is enrolled in mentorship
     */
    @GetMapping("/check/{profileId}/{mentorshipId}")
    public ResponseEntity<Boolean> isProfileEnrolledInMentorship(
            @PathVariable Long profileId, 
            @PathVariable Long mentorshipId) {
        try {
            boolean isEnrolled = enrollmentService.isProfileEnrolledInMentorship(profileId, mentorshipId);
            return ResponseEntity.ok(isEnrolled);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/enrollments/count/mentorship/{mentorshipId} - Get enrollment count by mentorship ID
     */
    @GetMapping("/count/mentorship/{mentorshipId}")
    public ResponseEntity<Long> getEnrollmentCountByMentorshipId(@PathVariable Long mentorshipId) {
        try {
            long count = enrollmentService.getEnrollmentCountByMentorshipId(mentorshipId);
            return ResponseEntity.ok(count);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/enrollments/count/profile/{profileId} - Get enrollment count by profile ID
     */
    @GetMapping("/count/profile/{profileId}")
    public ResponseEntity<Long> getEnrollmentCountByProfileId(@PathVariable Long profileId) {
        try {
            long count = enrollmentService.getEnrollmentCountByProfileId(profileId);
            return ResponseEntity.ok(count);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * POST /api/enrollments/update-statuses - Manually trigger enrollment status updates
     */
    @PostMapping("/update-statuses")
    public ResponseEntity<String> updateEnrollmentStatuses() {
        try {
            schedulerService.manualUpdateStatuses();
            return ResponseEntity.ok("Enrollment statuses updated successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update enrollment statuses: " + e.getMessage());
        }
    }
}
