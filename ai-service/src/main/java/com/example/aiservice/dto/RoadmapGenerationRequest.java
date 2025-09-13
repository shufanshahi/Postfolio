package com.example.aiservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoadmapGenerationRequest {
    private Long jobId;
    private Long profileId;
    private String jobTitle;
    private String jobDescription;
    private String requiredSkills;
    private String requiredExperience;
    private String requiredEducation;
    private String location;
    private String interviewDate; // ISO format
    private int daysUntilInterview;
    private String candidateSkills; // Optional: current skills of the candidate
    private String candidateExperience; // Optional: current experience level
}
