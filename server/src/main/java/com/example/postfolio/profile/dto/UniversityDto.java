package com.example.postfolio.profile.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UniversityDto {

    private Long id;
    private String universityName;
    private String degreeName;
    private Integer semesterCount;
    private List<Double> semesterResults;
    private Double cgpa;
    private Integer completedSemestersCount;
    private Double progressPercentage;
    private Boolean isDegreeCompleted;
    private String degreeDisplayName;

    // Helper method to get degree display name
    public String getDegreeDisplayName() {
        return degreeName + " - " + universityName;
    }
}