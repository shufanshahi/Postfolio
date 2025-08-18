package com.example.postfolio.mcqGeneration.dto;

import java.util.List;

public class MCQGenerationRequest {
    private String documentContent;
    private String documentName;

    public MCQGenerationRequest() {}

    public String getDocumentContent() { return documentContent; }
    public void setDocumentContent(String documentContent) { this.documentContent = documentContent; }

    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }
}