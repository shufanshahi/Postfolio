package com.example.postfolio.dashboard.service;

import com.example.postfolio.dashboard.dto.EngagementSummaryDTO;

public interface DashboardService {
    EngagementSummaryDTO getWeeklyEngagementSummary();
}