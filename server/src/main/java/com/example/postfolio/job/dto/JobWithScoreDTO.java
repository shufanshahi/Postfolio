package com.example.postfolio.job.dto;
import com.example.postfolio.job.model.AutoSelectStatus;
import com.example.postfolio.job.model.JobStatus;
import com.example.postfolio.jobMatchingEngine.dto.MatchingResult;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobWithScoreDTO {
    private Long jobId;
    private String title;
    private String position;
    private String description;
    private LocalDate datePosted;
    private LocalDate endDate;
    private JobStatus status;
    private Long employerId;
    private String requiredProject;
    private String requiredExperience;
    private String requiredEducation;
    private String requiredSkills;
    private List<Long> applicantIds;
    private List<Long> selectedApplicantIds;
    private MatchingResult matchingScore;
    
    // Auto-select related fields
    private AutoSelectStatus autoSelectStatus;
    private String offerLetter;
    private Integer desiredSelectNumber;
    private LocalDate letterExpiry;
    private List<Long> acceptedByProfileIds;
}
