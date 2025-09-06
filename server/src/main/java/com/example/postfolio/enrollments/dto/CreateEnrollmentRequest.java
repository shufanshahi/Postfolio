package com.example.postfolio.enrollments.dto;

import com.example.postfolio.enrollments.entity.Enrollment;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class CreateEnrollmentRequest {
    
    @NotNull(message = "Profile ID is required")
    private Long profileId;
    
    @NotNull(message = "Mentorship ID is required")
    private Long mentorshipId;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private Double price;
    
    private Enrollment.EnrollmentStatus status = Enrollment.EnrollmentStatus.APPROVED;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime time;
    
    // Constructors
    public CreateEnrollmentRequest() {}
    
    public CreateEnrollmentRequest(Long profileId, Long mentorshipId, Double price) {
        this.profileId = profileId;
        this.mentorshipId = mentorshipId;
        this.price = price;
    }
    
    public CreateEnrollmentRequest(Long profileId, Long mentorshipId, Double price, Enrollment.EnrollmentStatus status) {
        this.profileId = profileId;
        this.mentorshipId = mentorshipId;
        this.price = price;
        this.status = status;
    }
    
    public CreateEnrollmentRequest(Long profileId, Long mentorshipId, Double price, Enrollment.EnrollmentStatus status, LocalDateTime time) {
        this.profileId = profileId;
        this.mentorshipId = mentorshipId;
        this.price = price;
        this.status = status;
        this.time = time;
    }
    
    // Getters and Setters
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
    
    public Double getPrice() {
        return price;
    }
    
    public void setPrice(Double price) {
        this.price = price;
    }
    
    public Enrollment.EnrollmentStatus getStatus() {
        return status;
    }
    
    public void setStatus(Enrollment.EnrollmentStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getTime() {
        return time;
    }
    
    public void setTime(LocalDateTime time) {
        this.time = time;
    }
    
    @Override
    public String toString() {
        return "CreateEnrollmentRequest{" +
                "profileId=" + profileId +
                ", mentorshipId=" + mentorshipId +
                ", price=" + price +
                ", status=" + status +
                ", time=" + time +
                '}';
    }
}
