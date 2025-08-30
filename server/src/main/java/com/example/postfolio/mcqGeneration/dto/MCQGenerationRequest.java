package com.example.postfolio.mcqGeneration.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MCQGenerationRequest {
    private String documentContent;
    private String documentName;
    private String topic;
    private int questionCount;
    private String difficulty;
}