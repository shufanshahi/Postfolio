package com.example.postfolio.interview.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewProgressResponse {
    private Long id;
    private Long profileId;
    private Long mockInterviewId;
    private LocalDateTime time;
    private Double score;
    private List<String> weaknesses;
    private List<String> improvements;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
