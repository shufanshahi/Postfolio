package com.example.postfolio.job.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class JobRequest {
    private String title;
    private String position;
    private String description;
    private LocalDate datePosted;
    private LocalDate endDate;
    private Long employerId;
    private List<Long> applicantIds;
    private List<Long> selectedApplicantIds;
    private List<Long> rejectedApplicantIds;
    private String requiredProject;
    private String requiredAchievements;
    private String requiredEducation;
    private String requiredSkills;
}
