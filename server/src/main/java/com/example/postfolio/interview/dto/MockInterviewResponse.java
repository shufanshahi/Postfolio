package com.example.postfolio.interview.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MockInterviewResponse {
    private String introduction;
    private String role;
    private String experience;
    
    @JsonProperty(value = "interview_type", access = JsonProperty.Access.WRITE_ONLY)
    private String interviewType;
    
    private List<Question> questions;
    private List<String> audioUrls;
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Question {
        private int id;
        private String question;
    }
}
