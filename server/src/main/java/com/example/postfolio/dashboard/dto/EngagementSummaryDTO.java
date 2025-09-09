package com.example.postfolio.dashboard.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EngagementSummaryDTO {
    private Long profileViews;
    private Long newConnections;
    private Long messagesSent;
    private Long totalReactions;
    private Long engagementGrowth;
}
