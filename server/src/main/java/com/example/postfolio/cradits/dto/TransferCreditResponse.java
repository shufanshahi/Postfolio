package com.example.postfolio.cradits.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransferCreditResponse {
    private Long fromProfileId;
    private Long toProfileId;
    private BigDecimal amount;
    private String description;
    private BigDecimal fromProfileNewBalance;
    private BigDecimal toProfileNewBalance;
    private LocalDateTime transferDateTime;
    private String status;
    
    // Constructors
    public TransferCreditResponse() {}
    
    public TransferCreditResponse(Long fromProfileId, Long toProfileId, BigDecimal amount, 
                                String description, BigDecimal fromProfileNewBalance, 
                                BigDecimal toProfileNewBalance, LocalDateTime transferDateTime, String status) {
        this.fromProfileId = fromProfileId;
        this.toProfileId = toProfileId;
        this.amount = amount;
        this.description = description;
        this.fromProfileNewBalance = fromProfileNewBalance;
        this.toProfileNewBalance = toProfileNewBalance;
        this.transferDateTime = transferDateTime;
        this.status = status;
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
    
    public BigDecimal getFromProfileNewBalance() {
        return fromProfileNewBalance;
    }
    
    public void setFromProfileNewBalance(BigDecimal fromProfileNewBalance) {
        this.fromProfileNewBalance = fromProfileNewBalance;
    }
    
    public BigDecimal getToProfileNewBalance() {
        return toProfileNewBalance;
    }
    
    public void setToProfileNewBalance(BigDecimal toProfileNewBalance) {
        this.toProfileNewBalance = toProfileNewBalance;
    }
    
    public LocalDateTime getTransferDateTime() {
        return transferDateTime;
    }
    
    public void setTransferDateTime(LocalDateTime transferDateTime) {
        this.transferDateTime = transferDateTime;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    @Override
    public String toString() {
        return "TransferCreditResponse{" +
                "fromProfileId=" + fromProfileId +
                ", toProfileId=" + toProfileId +
                ", amount=" + amount +
                ", description='" + description + '\'' +
                ", fromProfileNewBalance=" + fromProfileNewBalance +
                ", toProfileNewBalance=" + toProfileNewBalance +
                ", transferDateTime=" + transferDateTime +
                ", status='" + status + '\'' +
                '}';
    }
}
