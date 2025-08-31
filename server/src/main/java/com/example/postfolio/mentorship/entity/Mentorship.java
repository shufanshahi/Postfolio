package com.example.postfolio.mentorship.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "mentorships")
public class Mentorship {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "profile_id", nullable = false)
    private Long profileId;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "specialization", nullable = false)
    private String specialization;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private MentorshipStatus status = MentorshipStatus.ACTIVE;
    
    @Column(name = "price", nullable = false)
    private Double price;
    
    @Column(name = "rating")
    private Double rating = 0.0;
    
    @ElementCollection
    @CollectionTable(name = "mentorship_enrolled_profiles", 
                    joinColumns = @JoinColumn(name = "mentorship_id"))
    @Column(name = "profile_id")
    private List<Long> enrolledProfileIds = new ArrayList<>();
    
    @ElementCollection
    @CollectionTable(name = "mentorship_available_times", 
                    joinColumns = @JoinColumn(name = "mentorship_id"))
    @Column(name = "available_time")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private List<LocalDateTime> availableTimes = new ArrayList<>();
    
    @Column(name = "repeat_status", nullable = false)
    private Boolean repeatStatus = false;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum MentorshipStatus {
        ACTIVE, INACTIVE
    }
    
    // Constructors
    public Mentorship() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public Mentorship(Long profileId, String name, String specialization, Double price) {
        this();
        this.profileId = profileId;
        this.name = name;
        this.specialization = specialization;
        this.price = price;
    }
    
    public Mentorship(Long profileId, Double price) {
        this();
        this.profileId = profileId;
        this.price = price;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getProfileId() {
        return profileId;
    }
    
    public void setProfileId(Long profileId) {
        this.profileId = profileId;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
        this.updatedAt = LocalDateTime.now();
    }
    
    public String getSpecialization() {
        return specialization;
    }
    
    public void setSpecialization(String specialization) {
        this.specialization = specialization;
        this.updatedAt = LocalDateTime.now();
    }
    
    public MentorshipStatus getStatus() {
        return status;
    }
    
    public void setStatus(MentorshipStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }
    
    public Double getPrice() {
        return price;
    }
    
    public void setPrice(Double price) {
        this.price = price;
        this.updatedAt = LocalDateTime.now();
    }
    
    public Double getRating() {
        return rating;
    }
    
    public void setRating(Double rating) {
        this.rating = rating;
        this.updatedAt = LocalDateTime.now();
    }
    
    public List<Long> getEnrolledProfileIds() {
        return enrolledProfileIds;
    }
    
    public void setEnrolledProfileIds(List<Long> enrolledProfileIds) {
        this.enrolledProfileIds = enrolledProfileIds;
        this.updatedAt = LocalDateTime.now();
    }
    
    public void addEnrolledProfileId(Long profileId) {
        if (this.enrolledProfileIds == null) {
            this.enrolledProfileIds = new ArrayList<>();
        }
        if (!this.enrolledProfileIds.contains(profileId)) {
            this.enrolledProfileIds.add(profileId);
            this.updatedAt = LocalDateTime.now();
        }
    }
    
    public List<LocalDateTime> getAvailableTimes() {
        return availableTimes;
    }
    
    public void setAvailableTimes(List<LocalDateTime> availableTimes) {
        this.availableTimes = availableTimes;
        this.updatedAt = LocalDateTime.now();
    }
    
    public Boolean getRepeatStatus() {
        return repeatStatus;
    }
    
    public void setRepeatStatus(Boolean repeatStatus) {
        this.repeatStatus = repeatStatus;
        this.updatedAt = LocalDateTime.now();
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
