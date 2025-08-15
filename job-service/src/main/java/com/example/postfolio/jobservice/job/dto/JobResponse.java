package com.example.postfolio.jobservice.job.dto;

import com.example.postfolio.jobservice.job.model.JobStatus;
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
    private String requirements;
    private JobStatus status;
    private Long employerId;
    private List<Long> applicantIds;
    private List<Long> selectedApplicantIds;
} 