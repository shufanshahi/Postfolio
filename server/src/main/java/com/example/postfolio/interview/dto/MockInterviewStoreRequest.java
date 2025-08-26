package com.example.postfolio.interview.dto;

import lombok.Data;

@Data
public class MockInterviewStoreRequest {
    private Long profileId;
    private String role;
    private String experience;
    private String interviewType;
    private String numQuestions;
}
