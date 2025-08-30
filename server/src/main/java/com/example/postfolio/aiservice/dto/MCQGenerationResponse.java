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
public class MCQGenerationResponse implements Serializable {
    private Long userId;
    private Long mcqSetId;
    private String documentName;
    private List<MCQQuestionDTO> questions;
    private boolean success;
    private String errorMessage;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MCQQuestionDTO implements Serializable {
        private String question;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String correctAnswer;
        private String explanation;
    }
}
