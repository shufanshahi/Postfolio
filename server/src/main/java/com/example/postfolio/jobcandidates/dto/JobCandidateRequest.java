package com.example.postfolio.jobcandidates.dto;

import com.example.postfolio.jobcandidates.model.CandidateStatus;
import lombok.Data;
import java.time.LocalDate;

@Data
public class JobCandidateRequest {
    private Long jobId;
    private Long profileId;
    private CandidateStatus status;
    private Double score;
    private LocalDate expireDate;
}