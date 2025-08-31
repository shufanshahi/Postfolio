package com.example.postfolio.mentorship.dto;

import jakarta.validation.constraints.NotNull;

public class EnrollMentorshipRequest {
    
    @NotNull(message = "Profile ID is required")
    private Long profileId;
    
    // Constructors
    public EnrollMentorshipRequest() {}
    
    public EnrollMentorshipRequest(Long profileId) {
        this.profileId = profileId;
    }
    
    // Getters and Setters
    public Long getProfileId() {
        return profileId;
    }
    
    public void setProfileId(Long profileId) {
        this.profileId = profileId;
    }
}
