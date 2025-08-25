package com.example.postfolio.interview.dto;

import lombok.Data;
import java.util.List;

@Data
public class MockInterviewRequest {
    private String role;
    private String experience;
    private String interviewType;
    private String numQuestions;
    private List<InterviewResponse> responses;
    
    @Data
    public static class InterviewResponse {
        private String questionId;
        private String questionTitle;
        private String responseKey;
        private String transcript;
        private String timestamp;
    }
}
