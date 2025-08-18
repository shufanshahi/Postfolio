package com.example.postfolio.mcqGeneration.dto;

import java.util.List;

public class MCQSetResponse {
    private Long id;
    private String documentName;
    private String createdAt;
    private List<MCQQuestionDTO> questions;

    public MCQSetResponse() {}

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public List<MCQQuestionDTO> getQuestions() { return questions; }
    public void setQuestions(List<MCQQuestionDTO> questions) { this.questions = questions; }
}