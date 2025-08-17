package com.example.postfolio.interview.dto;

import com.example.postfolio.interview.model.InterviewStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class InterviewRequest {
    @NotNull(message = "Job ID is required")
    private Long jobId;

    @NotNull(message = "Profile ID is required")
    private Long profileId;

    @NotNull(message = "Schedule is required")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime schedule;

    private InterviewStatus status;
    private String notes;
}
