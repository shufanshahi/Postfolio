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
public class InterviewGenerationRequest implements Serializable {
    private Long userId;
    private String jobRole;
    private String experience;
    private String company;
    private String interviewType;
    private String skills;
    private int questionCount;
}
