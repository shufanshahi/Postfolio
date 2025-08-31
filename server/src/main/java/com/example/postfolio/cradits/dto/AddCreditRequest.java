package com.example.postfolio.cradits.dto;

import java.math.BigDecimal;

public class AddCreditRequest {
    private Long profileId;
    private BigDecimal amount;
    private String description;
    
    // Constructors
    public AddCreditRequest() {}
    
    public AddCreditRequest(Long profileId, BigDecimal amount, String description) {
        this.profileId = profileId;
        this.amount = amount;
        this.description = description;
    }
    
    // Getters and Setters
    public Long getProfileId() {
        return profileId;
    }
    
    public void setProfileId(Long profileId) {
        this.profileId = profileId;
    }
    
    public BigDecimal getAmount() {
        return amount;
    }
    
    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    @Override
    public String toString() {
        return "AddCreditRequest{" +
                "profileId=" + profileId +
                ", amount=" + amount +
                ", description='" + description + '\'' +
                '}';
    }
}
