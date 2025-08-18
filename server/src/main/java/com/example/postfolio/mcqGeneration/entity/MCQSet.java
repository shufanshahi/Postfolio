package com.example.postfolio.mcqGeneration.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "mcq_sets")
public class MCQSet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "document_name")
    private String documentName;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "mcqSet", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MCQQuestion> questions;

    // Constructors
    public MCQSet() {}

    public MCQSet(Long userId, String documentName) {
        this.userId = userId;
        this.documentName = documentName;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<MCQQuestion> getQuestions() { return questions; }
    public void setQuestions(List<MCQQuestion> questions) { this.questions = questions; }
}