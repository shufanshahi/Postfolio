package com.example.postfolio.mentorship.dto;

import com.example.postfolio.mentorship.entity.Mentorship;
import jakarta.validation.constraints.NotNull;

public class UpdateStatusRequest {
    
    @NotNull(message = "Status is required")
    private Mentorship.MentorshipStatus status;
    
    // Constructors
    public UpdateStatusRequest() {}
    
    public UpdateStatusRequest(Mentorship.MentorshipStatus status) {
        this.status = status;
    }
    
    // Getters and Setters
    public Mentorship.MentorshipStatus getStatus() {
        return status;
    }
    
    public void setStatus(Mentorship.MentorshipStatus status) {
        this.status = status;
    }
}
