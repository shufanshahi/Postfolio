package com.example.postfolio.mentorship.dto;

import jakarta.validation.constraints.NotNull;

public class UpdateRepeatStatusRequest {
    
    @NotNull(message = "Repeat status is required")
    private Boolean repeatStatus;
    
    // Constructors
    public UpdateRepeatStatusRequest() {}
    
    public UpdateRepeatStatusRequest(Boolean repeatStatus) {
        this.repeatStatus = repeatStatus;
    }
    
    // Getters and Setters
    public Boolean getRepeatStatus() {
        return repeatStatus;
    }
    
    public void setRepeatStatus(Boolean repeatStatus) {
        this.repeatStatus = repeatStatus;
    }
}
