package com.example.postfolio.enrollments.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

@Entity
@Table(name = "enrollments")
public class Enrollment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "profile_id", nullable = false)
    private Long profileId;
    
    @Column(name = "mentorship_id", nullable = false)
    private Long mentorshipId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EnrollmentStatus status = EnrollmentStatus.APPROVED;
    
    @Column(name = "price", nullable = false)
    private Double price;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime time;
    
    @Column(name = "updated_at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    @Column(name = "rating")
    private Double rating; // Rating out of 5, can be null
    
    // Enum for status
    public enum EnrollmentStatus {
        APPROVED,
        REFUNDED,
        ONGOING,
        MISSED,
        COMPLETED
    }
    
    // Constructors
    public Enrollment() {}
    
    public Enrollment(Long profileId, Long mentorshipId, EnrollmentStatus status, Double price) {
        this.profileId = profileId;
        this.mentorshipId = mentorshipId;
        this.status = status;
        this.price = price;
        this.time = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public Enrollment(Long profileId, Long mentorshipId, EnrollmentStatus status, Double price, LocalDateTime time) {
        this.profileId = profileId;
        this.mentorshipId = mentorshipId;
        this.status = status;
        this.price = price;
        this.time = time != null ? time : LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        if (time == null) {
            time = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
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
    
    public EnrollmentStatus getStatus() {
        return status;
    }
    
    public void setStatus(EnrollmentStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
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
        this.updatedAt = LocalDateTime.now();
    }
    
    // toString method
    @Override
    public String toString() {
        return "Enrollment{" +
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
