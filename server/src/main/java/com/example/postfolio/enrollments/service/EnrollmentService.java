package com.example.postfolio.enrollments.service;

import com.example.postfolio.enrollments.dto.*;
import com.example.postfolio.enrollments.entity.Enrollment;
import com.example.postfolio.enrollments.repository.EnrollmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class EnrollmentService {
    
    private final EnrollmentRepository enrollmentRepository;
    
    @Autowired
    public EnrollmentService(EnrollmentRepository enrollmentRepository) {
        this.enrollmentRepository = enrollmentRepository;
    }
    
    /**
     * Get all enrollments
     */
    public List<EnrollmentResponse> getAllEnrollments() {
        List<Enrollment> enrollments = enrollmentRepository.findAll();
        return enrollments.stream()
                .map(EnrollmentResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all enrollments by profile ID
     */
    public List<EnrollmentResponse> getAllEnrollmentsByProfileId(Long profileId) {
        if (profileId == null) {
            throw new IllegalArgumentException("Profile ID cannot be null");
        }
        
        List<Enrollment> enrollments = enrollmentRepository.findByProfileIdOrderByTimeDesc(profileId);
        return enrollments.stream()
                .map(EnrollmentResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all enrollments by mentorship ID
     */
    public List<EnrollmentResponse> getAllEnrollmentsByMentorshipId(Long mentorshipId) {
        if (mentorshipId == null) {
            throw new IllegalArgumentException("Mentorship ID cannot be null");
        }
        
        List<Enrollment> enrollments = enrollmentRepository.findByMentorshipIdOrderByTimeDesc(mentorshipId);
        return enrollments.stream()
                .map(EnrollmentResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * Create a new enrollment
     */
    public EnrollmentResponse createEnrollment(CreateEnrollmentRequest request) {
        // Validate the request
        if (request.getProfileId() == null) {
            throw new IllegalArgumentException("Profile ID is required");
        }
        if (request.getMentorshipId() == null) {
            throw new IllegalArgumentException("Mentorship ID is required");
        }
        
        // Check if enrollment already exists
        if (enrollmentRepository.existsByProfileIdAndMentorshipId(request.getProfileId(), request.getMentorshipId())) {
            throw new IllegalStateException("Enrollment already exists for this profile and mentorship");
        }
        
        // Create new enrollment with manual time if provided
        Enrollment enrollment = new Enrollment(
                request.getProfileId(),
                request.getMentorshipId(),
                request.getStatus() != null ? request.getStatus() : Enrollment.EnrollmentStatus.APPROVED,
                request.getTime()
        );
        
        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);
        return new EnrollmentResponse(savedEnrollment);
    }
    
    /**
     * Get enrollment by ID
     */
    public Optional<EnrollmentResponse> getEnrollmentById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Enrollment ID cannot be null");
        }
        
        return enrollmentRepository.findById(id)
                .map(EnrollmentResponse::new);
    }
    
    /**
     * Update enrollment status
     */
    public EnrollmentResponse updateEnrollmentStatus(Long id, UpdateEnrollmentStatusRequest request) {
        if (id == null) {
            throw new IllegalArgumentException("Enrollment ID cannot be null");
        }
        if (request.getStatus() == null) {
            throw new IllegalArgumentException("Status is required");
        }
        
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Enrollment not found with id: " + id));
        
        enrollment.setStatus(request.getStatus());
        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);
        
        return new EnrollmentResponse(savedEnrollment);
    }
    
    /**
     * Delete enrollment
     */
    public void deleteEnrollment(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Enrollment ID cannot be null");
        }
        
        if (!enrollmentRepository.existsById(id)) {
            throw new RuntimeException("Enrollment not found with id: " + id);
        }
        
        enrollmentRepository.deleteById(id);
    }
    
    /**
     * Get enrollments by profile ID and status
     */
    public List<EnrollmentResponse> getEnrollmentsByProfileIdAndStatus(Long profileId, Enrollment.EnrollmentStatus status) {
        if (profileId == null) {
            throw new IllegalArgumentException("Profile ID cannot be null");
        }
        if (status == null) {
            throw new IllegalArgumentException("Status cannot be null");
        }
        
        List<Enrollment> enrollments = enrollmentRepository.findByProfileIdAndStatus(profileId, status);
        return enrollments.stream()
                .map(EnrollmentResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * Get enrollments by mentorship ID and status
     */
    public List<EnrollmentResponse> getEnrollmentsByMentorshipIdAndStatus(Long mentorshipId, Enrollment.EnrollmentStatus status) {
        if (mentorshipId == null) {
            throw new IllegalArgumentException("Mentorship ID cannot be null");
        }
        if (status == null) {
            throw new IllegalArgumentException("Status cannot be null");
        }
        
        List<Enrollment> enrollments = enrollmentRepository.findByMentorshipIdAndStatus(mentorshipId, status);
        return enrollments.stream()
                .map(EnrollmentResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * Check if a profile is enrolled in a mentorship
     */
    public boolean isProfileEnrolledInMentorship(Long profileId, Long mentorshipId) {
        if (profileId == null || mentorshipId == null) {
            return false;
        }
        
        return enrollmentRepository.existsByProfileIdAndMentorshipId(profileId, mentorshipId);
    }
    
    /**
     * Get enrollment count by mentorship ID
     */
    public long getEnrollmentCountByMentorshipId(Long mentorshipId) {
        if (mentorshipId == null) {
            throw new IllegalArgumentException("Mentorship ID cannot be null");
        }
        
        return enrollmentRepository.countByMentorshipId(mentorshipId);
    }
    
    /**
     * Get enrollment count by profile ID
     */
    public long getEnrollmentCountByProfileId(Long profileId) {
        if (profileId == null) {
            throw new IllegalArgumentException("Profile ID cannot be null");
        }
        
        return enrollmentRepository.countByProfileId(profileId);
    }
}
