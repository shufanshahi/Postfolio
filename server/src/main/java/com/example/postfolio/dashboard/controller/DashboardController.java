package com.example.postfolio.dashboard.controller;

import com.example.postfolio.dashboard.dto.EngagementSummaryDTO;
import com.example.postfolio.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/engagement")
    public ResponseEntity<EngagementSummaryDTO> getEngagementSummary() {
        EngagementSummaryDTO engagementSummary = dashboardService.getWeeklyEngagementSummary();
        return ResponseEntity.ok(engagementSummary);
    }
}