package com.example.postfolio.jobcandidates.dto;

import com.example.postfolio.jobcandidates.model.CandidateStatus;
import lombok.Data;

@Data
public class StatusUpdateRequest {
    private CandidateStatus status;
    private Boolean proceed;
    private Integer interval; // interval in days to calculate expire date
}