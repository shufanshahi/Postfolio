package com.example.postfolio.enrollments.dto;

import com.example.postfolio.enrollments.entity.Enrollment;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class EnrollmentResponse {
    
    private Long id;
    private Long profileId;
    private Long mentorshipId;
    private Enrollment.EnrollmentStatus status;
    private Double price;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime time;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    private Double rating; // Rating out of 5, can be null
    
    // Constructors
    public EnrollmentResponse() {}
    
    public EnrollmentResponse(Enrollment enrollment) {
        this.id = enrollment.getId();
        this.profileId = enrollment.getProfileId();
        this.mentorshipId = enrollment.getMentorshipId();
        this.status = enrollment.getStatus();
        this.price = enrollment.getPrice();
        this.time = enrollment.getTime();
        this.updatedAt = enrollment.getUpdatedAt();
        this.rating = enrollment.getRating();
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
    
    public Long getMentorshipId() {
        return mentorshipId;
    }
    
    public void setMentorshipId(Long mentorshipId) {
        this.mentorshipId = mentorshipId;
    }
    
    public Enrollment.EnrollmentStatus getStatus() {
        return status;
    }
    
    public void setStatus(Enrollment.EnrollmentStatus status) {
        this.status = status;
    }
    
    public Double getPrice() {
        return price;
    }
    
    public void setPrice(Double price) {
        this.price = price;
    }
    
    public LocalDateTime getTime() {
        return time;
    }
    
    public void setTime(LocalDateTime time) {
        this.time = time;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public Double getRating() {
        return rating;
    }
    
    public void setRating(Double rating) {
        this.rating = rating;
    }
    
    @Override
    public String toString() {
        return "EnrollmentResponse{" +
                "id=" + id +
                ", profileId=" + profileId +
                ", mentorshipId=" + mentorshipId +
                ", status=" + status +
                ", price=" + price +
                ", time=" + time +
                ", updatedAt=" + updatedAt +
                ", rating=" + rating +
                '}';
    }
}
