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
    private String requiredProject;
    private String requiredExperience;
    private String requiredSkills;
    private String requiredEducation;
    private LocalDate endDate;
    private Long employerId;
    private Long minSalary;
    private Long maxSalary;
    private List<Long> applicantIds;
    private List<Long> selectedApplicantIds;
    private  List<Long> rejectedApplicantIds;
}