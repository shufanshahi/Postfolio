package com.example.postfolio.aiservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MCQGenerationRequest implements Serializable {
    private Long userId;
    private String documentName;
    private String documentContent;
    private String topic;
    private int questionCount;
    private String difficulty;
}
