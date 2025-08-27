package com.example.postfolio.profile.dto;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkDto {

    private Long id;
    private String companyName;
    private String position;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isCurrent;
    private String description;
    private String achievements;
    private String technologiesUsed;
    
    // Computed fields
    private String duration;
    private String displayDateRange;
} 