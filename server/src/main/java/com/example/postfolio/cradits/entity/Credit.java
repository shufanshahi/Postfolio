package com.example.postfolio.cradits.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "credits")
public class Credit {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "profile_id", nullable = false, unique = true)
    private Long profileId;
    
    @Column(name = "total_credit", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalCredit = BigDecimal.ZERO;
    
    @ElementCollection
    @CollectionTable(
        name = "credit_transaction_history",
        joinColumns = @JoinColumn(name = "credit_id")
    )
    @Column(name = "transaction", length = 500)
    private List<String> transactionHistory = new ArrayList<>();
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public Credit() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public Credit(Long profileId) {
        this();
        this.profileId = profileId;
    }
    
    public Credit(Long profileId, BigDecimal totalCredit) {
        this(profileId);
        this.totalCredit = totalCredit;
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
        this.updatedAt = LocalDateTime.now();
    }
    
    public List<String> getTransactionHistory() {
        return transactionHistory;
    }
    
    public void setTransactionHistory(List<String> transactionHistory) {
        this.transactionHistory = transactionHistory;
        this.updatedAt = LocalDateTime.now();
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
    
    // Helper methods
    public void addCredit(BigDecimal amount, String description) {
        this.totalCredit = this.totalCredit.add(amount);
        this.addTransaction("CREDIT: +" + amount + " - " + description + " [" + LocalDateTime.now() + "]");
        this.updatedAt = LocalDateTime.now();
    }
    
    public boolean deductCredit(BigDecimal amount, String description) {
        if (this.totalCredit.compareTo(amount) >= 0) {
            this.totalCredit = this.totalCredit.subtract(amount);
            this.addTransaction("DEBIT: -" + amount + " - " + description + " [" + LocalDateTime.now() + "]");
            this.updatedAt = LocalDateTime.now();
            return true;
        }
        return false;
    }
    
    public void addTransaction(String transaction) {
        if (this.transactionHistory == null) {
            this.transactionHistory = new ArrayList<>();
        }
        this.transactionHistory.add(transaction);
        this.updatedAt = LocalDateTime.now();
    }
    
    @Override
    public String toString() {
        return "Credit{" +
                "id=" + id +
                ", profileId=" + profileId +
                ", totalCredit=" + totalCredit +
                ", transactionHistorySize=" + (transactionHistory != null ? transactionHistory.size() : 0) +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
