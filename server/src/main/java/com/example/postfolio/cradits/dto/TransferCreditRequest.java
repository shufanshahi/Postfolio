package com.example.postfolio.cradits.dto;

import java.math.BigDecimal;

public class TransferCreditRequest {
    private Long fromProfileId;
    private Long toProfileId;
    private BigDecimal amount;
    private String description;
    
    // Constructors
    public TransferCreditRequest() {}
    
    public TransferCreditRequest(Long fromProfileId, Long toProfileId, BigDecimal amount, String description) {
        this.fromProfileId = fromProfileId;
        this.toProfileId = toProfileId;
        this.amount = amount;
        this.description = description;
    }
    
    // Getters and Setters
    public Long getFromProfileId() {
        return fromProfileId;
    }
    
    public void setFromProfileId(Long fromProfileId) {
        this.fromProfileId = fromProfileId;
    }
    
    public Long getToProfileId() {
        return toProfileId;
    }
    
    public void setToProfileId(Long toProfileId) {
        this.toProfileId = toProfileId;
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
        return "TransferCreditRequest{" +
                "fromProfileId=" + fromProfileId +
                ", toProfileId=" + toProfileId +
                ", amount=" + amount +
                ", description='" + description + '\'' +
                '}';
    }
}
