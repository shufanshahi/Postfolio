package com.example.postfolio.job.dto;

import com.example.postfolio.job.model.AutoSelectStatus;
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
    private String location;
    private List<Long> applicantIds;
    private List<Long> selectedApplicantIds;
    private List<Long> rejectedApplicantIds;
    
    // Auto-select related fields (optional for job creation)
    private AutoSelectStatus autoSelectStatus;
    private String offerLetter;
    private Integer desiredSelectNumber;
    private LocalDate letterExpiry;
    private List<Long> acceptedByProfileIds;
}