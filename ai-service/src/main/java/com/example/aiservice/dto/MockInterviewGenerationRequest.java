package com.example.aiservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MockInterviewGenerationRequest implements Serializable {
    private String role;
    private String experience;
    private String interviewType;
    private String numQuestions;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterviewResponse implements Serializable {
        private String responseKey;
        private String transcript;
    }
}