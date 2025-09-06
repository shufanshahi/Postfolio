package com.example.postfolio.mentorship.dto;

import com.example.postfolio.mentorship.entity.Mentorship.MentorshipStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public class UpdateMentorshipRequest {
    
    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    private String name;
    
    @NotBlank(message = "Specialization is required")
    @Size(max = 255, message = "Specialization must not exceed 255 characters")
    private String specialization;
    
    @NotNull(message = "Status is required")
    private MentorshipStatus status;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private Double price;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private List<LocalDateTime> availableTimes;
    
    @NotNull(message = "Repeat status is required")
    private Boolean repeatStatus;
    
    // Default constructor
    public UpdateMentorshipRequest() {}
    
    // Constructor with all fields
    public UpdateMentorshipRequest(String name, String specialization, MentorshipStatus status, 
                                 Double price, List<LocalDateTime> availableTimes, Boolean repeatStatus) {
        this.name = name;
        this.specialization = specialization;
        this.status = status;
        this.price = price;
        this.availableTimes = availableTimes;
        this.repeatStatus = repeatStatus;
    }
    
    // Getters and setters
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
    
    public MentorshipStatus getStatus() {
        return status;
    }
    
    public void setStatus(MentorshipStatus status) {
        this.status = status;
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
    
    @Override
    public String toString() {
        return "UpdateMentorshipRequest{" +
                "name='" + name + '\'' +
                ", specialization='" + specialization + '\'' +
                ", status=" + status +
                ", price=" + price +
                ", availableTimes=" + availableTimes +
                ", repeatStatus=" + repeatStatus +
                '}';
    }
}
