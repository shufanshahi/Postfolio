package com.example.postfolio.mcqGeneration.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MCQSetResponse {
    private Long id;
    private String documentName;
    private String createdAt;
    private List<MCQQuestionDTO> questions;
    private boolean success;
    private String message;
}