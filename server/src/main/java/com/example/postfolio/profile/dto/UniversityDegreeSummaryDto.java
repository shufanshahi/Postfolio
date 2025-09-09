package com.example.postfolio.profile.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UniversityDegreeSummaryDto {

    private String universityName;
    private String degreeName;
    private Double averageCgpa;
    private Integer totalSemesters;
    private Integer completedSemesters;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isCompleted;
    private List<UniversityDto> semesters; // All semester details

    // Helper method to get display name
    public String getDisplayName() {
        return universityName + " - " + degreeName;
    }

    // Helper method to get formatted CGPA
    public String getFormattedCgpa() {
        if (averageCgpa == null) {
            return "N/A";
        }
        return String.format("%.2f", averageCgpa);
    }

    // Helper method to get completion status
    public String getCompletionStatus() {
        if (isCompleted) {
            return "Completed";
        } else {
            return completedSemesters + "/" + totalSemesters + " semesters";
        }
    }
}
