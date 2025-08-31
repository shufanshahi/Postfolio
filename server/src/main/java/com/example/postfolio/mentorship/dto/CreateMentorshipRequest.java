package com.example.postfolio.mentorship.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDateTime;
import java.util.List;

public class CreateMentorshipRequest {
    
    @NotNull(message = "Profile ID is required")
    private Long profileId;
    
    @NotNull(message = "Name is required")
    private String name;
    
    @NotNull(message = "Specialization is required")
    private String specialization;
    
    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private Double price;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private List<LocalDateTime> availableTimes;
    
    private Boolean repeatStatus = false;
    
    // Constructors
    public CreateMentorshipRequest() {}
    
    public CreateMentorshipRequest(Long profileId, String name, String specialization, Double price, List<LocalDateTime> availableTimes, Boolean repeatStatus) {
        this.profileId = profileId;
        this.name = name;
        this.specialization = specialization;
        this.price = price;
        this.availableTimes = availableTimes;
        this.repeatStatus = repeatStatus;
    }
    
    public CreateMentorshipRequest(Long profileId, Double price, List<LocalDateTime> availableTimes, Boolean repeatStatus) {
        this.profileId = profileId;
        this.price = price;
        this.availableTimes = availableTimes;
        this.repeatStatus = repeatStatus;
    }
    
    // Getters and Setters
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
    }
    
    public String getSpecialization() {
        return specialization;
    }
    
    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }
    
    public Double getPrice() {
        return price;
    }
    
    public void setPrice(Double price) {
        this.price = price;
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
}
