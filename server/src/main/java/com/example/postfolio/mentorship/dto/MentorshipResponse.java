package com.example.postfolio.mentorship.dto;

import com.example.postfolio.mentorship.entity.Mentorship;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;

public class MentorshipResponse {
    
    private Long id;
    private Long profileId;
    private Mentorship.MentorshipStatus status;
    private Double price;
    private Double rating;
    private List<Long> enrolledProfileIds;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private List<LocalDateTime> availableTimes;
    
    private Boolean repeatStatus;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // Constructors
    public MentorshipResponse() {}
    
    public MentorshipResponse(Mentorship mentorship) {
        this.id = mentorship.getId();
        this.profileId = mentorship.getProfileId();
        this.status = mentorship.getStatus();
        this.price = mentorship.getPrice();
        this.rating = mentorship.getRating();
        this.enrolledProfileIds = mentorship.getEnrolledProfileIds();
        this.availableTimes = mentorship.getAvailableTimes();
        this.repeatStatus = mentorship.getRepeatStatus();
        this.createdAt = mentorship.getCreatedAt();
        this.updatedAt = mentorship.getUpdatedAt();
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
    
    public Mentorship.MentorshipStatus getStatus() {
        return status;
    }
    
    public void setStatus(Mentorship.MentorshipStatus status) {
        this.status = status;
    }
    
    public Double getPrice() {
        return price;
    }
    
    public void setPrice(Double price) {
        this.price = price;
    }
    
    public Double getRating() {
        return rating;
    }
    
    public void setRating(Double rating) {
        this.rating = rating;
    }
    
    public List<Long> getEnrolledProfileIds() {
        return enrolledProfileIds;
    }
    
    public void setEnrolledProfileIds(List<Long> enrolledProfileIds) {
        this.enrolledProfileIds = enrolledProfileIds;
    }
    
    public List<LocalDateTime> getAvailableTimes() {
        return availableTimes;
    }
    
    public void setAvailableTimes(List<LocalDateTime> availableTimes) {
        this.availableTimes = availableTimes;
    }
    
    public Boolean getRepeatStatus() {
        return repeatStatus;
    }
    
    public void setRepeatStatus(Boolean repeatStatus) {
        this.repeatStatus = repeatStatus;
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
}
