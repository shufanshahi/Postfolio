package com.example.postfolio.profile.dto;

import lombok.*;

import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EducationSummaryDto {

    private List<SchoolDto> schools;
    private List<UniversityDto> universities;
    private List<WorkDto> works;
    private List<UniversityDegreeSummaryDto> universityDegreeSummaries; // New field for calculated averages

    // Helper method to get SSC result
    public SchoolDto getSscResult() {
        return schools.stream()
                .filter(school -> school.getClassLevel() == 10)
                .findFirst()
                .orElse(null);
    }

    // Helper method to get HSC result
    public SchoolDto getHscResult() {
        return schools.stream()
                .filter(school -> school.getClassLevel() == 12)
                .findFirst()
                .orElse(null);
    }

    // Helper method to get latest university semester (old method - deprecated)
    @Deprecated
    public UniversityDto getLatestUniversitySemester() {
        return universities.stream()
                .max((u1, u2) -> Integer.compare(u1.getSemesterCount(), u2.getSemesterCount()))
                .orElse(null);
    }

    // New method to get the primary university degree summary (highest CGPA or most
    // recent)
    public UniversityDegreeSummaryDto getPrimaryUniversityDegree() {
        if (universityDegreeSummaries == null || universityDegreeSummaries.isEmpty()) {
            return null;
        }

        // Return the one with highest CGPA, or most recent if CGPAs are equal
        return universityDegreeSummaries.stream()
                .max((u1, u2) -> {
                    if (u1.getAverageCgpa() != null && u2.getAverageCgpa() != null) {
                        int cgpaComparison = Double.compare(u1.getAverageCgpa(), u2.getAverageCgpa());
                        if (cgpaComparison != 0) {
                            return cgpaComparison;
                        }
                    }
                    // If CGPA is equal or null, compare by end date
                    if (u1.getEndDate() != null && u2.getEndDate() != null) {
                        return u1.getEndDate().compareTo(u2.getEndDate());
                    }
                    return 0;
                })
                .orElse(universityDegreeSummaries.get(0));
    }

    // Helper method to get completed semesters count
    public long getCompletedSemestersCount() {
        return universities.stream()
                .mapToInt(uni -> uni.getCompletedSemestersCount())
                .sum();
    }

    // Helper method to get total semesters count
    public int getTotalSemestersCount() {
        return universities.stream()
                .mapToInt(uni -> uni.getSemesterCount())
                .sum();
    }

    // Helper method to get total degrees count
    public int getTotalDegreesCount() {
        if (universityDegreeSummaries == null) {
            return 0;
        }
        return universityDegreeSummaries.size();
    }

    // Helper method to get completed degrees
    public List<UniversityDegreeSummaryDto> getCompletedDegrees() {
        if (universityDegreeSummaries == null) {
            return List.of();
        }
        return universityDegreeSummaries.stream()
                .filter(UniversityDegreeSummaryDto::getIsCompleted)
                .collect(Collectors.toList());
    }
}