package com.example.aiservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobMatchingResponse implements Serializable {
    private Long jobId;
    private Long profileId;
    private double score;
    private String explanation;
    private String strengths;
    private String gaps;
    private String recommendations;
    private boolean success;
    private String errorMessage;
}
