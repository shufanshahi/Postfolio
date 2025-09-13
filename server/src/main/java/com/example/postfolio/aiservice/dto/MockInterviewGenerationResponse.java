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
public class MockInterviewGenerationResponse implements Serializable {
    private String introduction;
    private String role;
    private String experience;
    private String interviewType;
    private List<Question> questions;
    private boolean success;
    private String errorMessage;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Question implements Serializable {
        private int id;
        private String question;
    }
}