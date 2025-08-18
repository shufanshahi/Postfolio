package com.example.postfolio.job.dto;

import com.example.postfolio.job.model.JobStatus;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class JobResponse {
    private Long jobId;
    private String title;
    private String position;
    private String description;
    private LocalDate datePosted;
    private LocalDate endDate;
    private String requiredProject;
    private String requiredAchievements;
    private String requiredEducation;
    private String requiredSkills;
    private JobStatus status;
    private Long employerId;
    private List<Long> applicantIds;
    private List<Long> selectedApplicantIds;
    private List<Long> rejectedApplicantIds;
}
