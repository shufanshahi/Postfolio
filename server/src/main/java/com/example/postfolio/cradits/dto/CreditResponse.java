package com.example.postfolio.cradits.dto;

import com.example.postfolio.cradits.entity.Credit;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class CreditResponse {
    private Long id;
    private Long profileId;
    private BigDecimal totalCredit;
    private List<String> transactionHistory;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public CreditResponse() {}
    
    public CreditResponse(Credit credit) {
        this.id = credit.getId();
        this.profileId = credit.getProfileId();
        this.totalCredit = credit.getTotalCredit();
        this.transactionHistory = credit.getTransactionHistory();
        this.createdAt = credit.getCreatedAt();
        this.updatedAt = credit.getUpdatedAt();
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
    
    public BigDecimal getTotalCredit() {
        return totalCredit;
    }
    
    public void setTotalCredit(BigDecimal totalCredit) {
        this.totalCredit = totalCredit;
    }
    
    public List<String> getTransactionHistory() {
        return transactionHistory;
    }
    
    public void setTransactionHistory(List<String> transactionHistory) {
        this.transactionHistory = transactionHistory;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @Override
    public String toString() {
        return "CreditResponse{" +
                "id=" + id +
                ", profileId=" + profileId +
                ", totalCredit=" + totalCredit +
                ", transactionHistorySize=" + (transactionHistory != null ? transactionHistory.size() : 0) +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
