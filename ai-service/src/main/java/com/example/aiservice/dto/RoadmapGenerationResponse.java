package com.example.aiservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoadmapGenerationResponse {
    private Long jobId;
    private Long profileId;
    private String title;
    private String description;
    private List<RoadmapItemResponse> items;
    private boolean success;
    private String errorMessage;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoadmapItemResponse {
        private String date; // ISO date format
        private String type; // LEARN_TOPIC, REVISION, PRACTICE, MOCK_INTERVIEW, BREAK_DAY, FINAL_REVIEW
        private String title;
        private String description;
        private List<String> resources; // URLs or resource descriptions
        private int estimatedHours;
        private String priority; // HIGH, MEDIUM, LOW
    }
}
