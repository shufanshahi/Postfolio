package com.example.postfolio.mentorship.service;

import com.example.postfolio.mentorship.dto.*;
import com.example.postfolio.mentorship.entity.Mentorship;
import com.example.postfolio.mentorship.repository.MentorshipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class MentorshipService {
    
    private final MentorshipRepository mentorshipRepository;
    
    @Autowired
    public MentorshipService(MentorshipRepository mentorshipRepository) {
        this.mentorshipRepository = mentorshipRepository;
    }
    
    /**
     * Get all mentorships
     */
    public List<MentorshipResponse> getAllMentorships() {
        List<Mentorship> mentorships = mentorshipRepository.findAll();
        return mentorships.stream()
                .map(MentorshipResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all mentorships by profile ID
     */
    public List<MentorshipResponse> getAllMentorshipsByProfileId(Long profileId) {
        if (profileId == null) {
            throw new IllegalArgumentException("Profile ID cannot be null");
        }
        
        List<Mentorship> mentorships = mentorshipRepository.findByProfileId(profileId);
        return mentorships.stream()
                .map(MentorshipResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * Get mentorship by ID
     */
    public Optional<MentorshipResponse> getMentorshipById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Mentorship ID cannot be null");
        }
        
        return mentorshipRepository.findById(id)
                .map(MentorshipResponse::new);
    }
    
    /**
     * Create a new mentorship
     */
    public MentorshipResponse createMentorship(CreateMentorshipRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Create mentorship request cannot be null");
        }
        
        if (request.getProfileId() == null) {
            throw new IllegalArgumentException("Profile ID is required");
        }
        
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }
        
        if (request.getSpecialization() == null || request.getSpecialization().trim().isEmpty()) {
            throw new IllegalArgumentException("Specialization is required");
        }
        
        if (request.getPrice() == null || request.getPrice() <= 0) {
            throw new IllegalArgumentException("Price must be positive");
        }
        
        Mentorship mentorship = new Mentorship();
        mentorship.setProfileId(request.getProfileId());
        mentorship.setName(request.getName().trim());
        mentorship.setSpecialization(request.getSpecialization().trim());
        mentorship.setPrice(request.getPrice());
        mentorship.setStatus(Mentorship.MentorshipStatus.ACTIVE);
        
        if (request.getAvailableTimes() != null) {
            mentorship.setAvailableTimes(request.getAvailableTimes());
        }
        
        if (request.getRepeatStatus() != null) {
            mentorship.setRepeatStatus(request.getRepeatStatus());
        }
        
        Mentorship savedMentorship = mentorshipRepository.save(mentorship);
        return new MentorshipResponse(savedMentorship);
    }
    
    /**
     * Enroll a profile in a mentorship
     */
    public MentorshipResponse enrollInMentorship(Long mentorshipId, EnrollMentorshipRequest request) {
        if (mentorshipId == null) {
            throw new IllegalArgumentException("Mentorship ID cannot be null");
        }
        
        if (request == null || request.getProfileId() == null) {
            throw new IllegalArgumentException("Profile ID is required for enrollment");
        }
        
        Mentorship mentorship = mentorshipRepository.findById(mentorshipId)
                .orElseThrow(() -> new RuntimeException("Mentorship not found with ID: " + mentorshipId));
        
        // Check if mentorship is active
        if (mentorship.getStatus() != Mentorship.MentorshipStatus.ACTIVE) {
            throw new RuntimeException("Cannot enroll in inactive mentorship");
        }
        
        // Check if profile is already enrolled
        if (mentorshipRepository.isProfileEnrolledInMentorship(mentorshipId, request.getProfileId())) {
            throw new RuntimeException("Profile is already enrolled in this mentorship");
        }
        
        // Check if trying to enroll in own mentorship
        if (mentorship.getProfileId().equals(request.getProfileId())) {
            throw new RuntimeException("Cannot enroll in your own mentorship");
        }
        
        mentorship.addEnrolledProfileId(request.getProfileId());
        Mentorship savedMentorship = mentorshipRepository.save(mentorship);
        
        return new MentorshipResponse(savedMentorship);
    }
    
    /**
     * Update repeat status of a mentorship
     */
    public MentorshipResponse updateRepeatStatus(Long mentorshipId, UpdateRepeatStatusRequest request) {
        if (mentorshipId == null) {
            throw new IllegalArgumentException("Mentorship ID cannot be null");
        }
        
        if (request == null || request.getRepeatStatus() == null) {
            throw new IllegalArgumentException("Repeat status is required");
        }
        
        Mentorship mentorship = mentorshipRepository.findById(mentorshipId)
                .orElseThrow(() -> new RuntimeException("Mentorship not found with ID: " + mentorshipId));
        
        mentorship.setRepeatStatus(request.getRepeatStatus());
        Mentorship savedMentorship = mentorshipRepository.save(mentorship);
        
        return new MentorshipResponse(savedMentorship);
    }
    
    /**
     * Update status of a mentorship
     */
    public MentorshipResponse updateStatus(Long mentorshipId, UpdateStatusRequest request) {
        if (mentorshipId == null) {
            throw new IllegalArgumentException("Mentorship ID cannot be null");
        }
        
        if (request == null || request.getStatus() == null) {
            throw new IllegalArgumentException("Status is required");
        }
        
        Mentorship mentorship = mentorshipRepository.findById(mentorshipId)
                .orElseThrow(() -> new RuntimeException("Mentorship not found with ID: " + mentorshipId));
        
        mentorship.setStatus(request.getStatus());
        Mentorship savedMentorship = mentorshipRepository.save(mentorship);
        
        return new MentorshipResponse(savedMentorship);
    }
    
    /**
     * Get mentorships where a profile is enrolled
     */
    public List<MentorshipResponse> getMentorshipsByEnrolledProfile(Long profileId) {
        if (profileId == null) {
            throw new IllegalArgumentException("Profile ID cannot be null");
        }
        
        List<Mentorship> mentorships = mentorshipRepository.findByEnrolledProfileId(profileId);
        return mentorships.stream()
                .map(MentorshipResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * Get active mentorships only
     */
    public List<MentorshipResponse> getActiveMentorships() {
        List<Mentorship> mentorships = mentorshipRepository.findByStatus(Mentorship.MentorshipStatus.ACTIVE);
        return mentorships.stream()
                .map(MentorshipResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * Delete a mentorship (soft delete by setting status to INACTIVE)
     */
    public void deleteMentorship(Long mentorshipId) {
        if (mentorshipId == null) {
            throw new IllegalArgumentException("Mentorship ID cannot be null");
        }
        
        Mentorship mentorship = mentorshipRepository.findById(mentorshipId)
                .orElseThrow(() -> new RuntimeException("Mentorship not found with ID: " + mentorshipId));
        
        mentorship.setStatus(Mentorship.MentorshipStatus.INACTIVE);
        mentorshipRepository.save(mentorship);
    }
    
    /**
     * Get enrolled profiles count for a mentorship
     */
    public Integer getEnrolledProfilesCount(Long mentorshipId) {
        if (mentorshipId == null) {
            throw new IllegalArgumentException("Mentorship ID cannot be null");
        }
        
        return mentorshipRepository.countEnrolledProfiles(mentorshipId);
    }
    
    /**
     * Search mentorships by name
     */
    public List<MentorshipResponse> searchMentorshipsByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be null or empty");
        }
        
        List<Mentorship> mentorships = mentorshipRepository.findByNameContainingIgnoreCase(name.trim());
        return mentorships.stream()
                .map(MentorshipResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * Search mentorships by specialization
     */
    public List<MentorshipResponse> searchMentorshipsBySpecialization(String specialization) {
        if (specialization == null || specialization.trim().isEmpty()) {
            throw new IllegalArgumentException("Specialization cannot be null or empty");
        }
        
        List<Mentorship> mentorships = mentorshipRepository.findBySpecializationContainingIgnoreCase(specialization.trim());
        return mentorships.stream()
                .map(MentorshipResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * Search mentorships by name and specialization
     */
    public List<MentorshipResponse> searchMentorshipsByNameAndSpecialization(String name, String specialization) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be null or empty");
        }
        if (specialization == null || specialization.trim().isEmpty()) {
            throw new IllegalArgumentException("Specialization cannot be null or empty");
        }
        
        List<Mentorship> mentorships = mentorshipRepository.findByNameContainingIgnoreCaseAndSpecializationContainingIgnoreCase(name.trim(), specialization.trim());
        return mentorships.stream()
                .map(MentorshipResponse::new)
                .collect(Collectors.toList());
    }
    
    /**
     * Search active mentorships by specialization
     */
    public List<MentorshipResponse> searchActiveMentorshipsBySpecialization(String specialization) {
        if (specialization == null || specialization.trim().isEmpty()) {
            throw new IllegalArgumentException("Specialization cannot be null or empty");
        }
        
        List<Mentorship> mentorships = mentorshipRepository.findBySpecializationContainingIgnoreCaseAndStatus(specialization.trim(), Mentorship.MentorshipStatus.ACTIVE);
        return mentorships.stream()
                .map(MentorshipResponse::new)
                .collect(Collectors.toList());
    }
}
