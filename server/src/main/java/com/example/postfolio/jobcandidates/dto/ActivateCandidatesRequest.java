package com.example.postfolio.jobcandidates.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class ActivateCandidatesRequest {
    private Integer desiredSelectNumber;
    private LocalDate expireDate;
}