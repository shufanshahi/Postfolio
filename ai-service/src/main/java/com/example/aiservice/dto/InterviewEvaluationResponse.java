package com.example.aiservice.dto;

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
public class InterviewEvaluationResponse implements Serializable {
    private int rating;
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> improvements;
    private boolean success;
    private String errorMessage;
}