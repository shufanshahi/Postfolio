package com.example.postfolio.aiservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewGenerationResponse implements Serializable {
    private Long userId;
    private String jobRole;
    private List<InterviewQuestionDTO> questions;
    private boolean success;
    private String errorMessage;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterviewQuestionDTO implements Serializable {
        private String question;
        private String category;
        private String difficulty;
        private String sampleAnswer;
        private List<String> keyPoints;
    }
}
