package com.example.postfolio.profile.dto;





import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EducationSummaryDto {

    private List<SchoolDto> schools;
    private List<UniversityDto> universities;
    private List<WorkDto> works;

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

    // Helper method to get latest university semester
    public UniversityDto getLatestUniversitySemester() {
        return universities.stream()
                .max((u1, u2) -> Integer.compare(u1.getSemesterNumber(), u2.getSemesterNumber()))
                .orElse(null);
    }

    // Helper method to get completed semesters count
    public long getCompletedSemestersCount() {
        return universities.stream()
                .filter(UniversityDto::getIsCompleted)
                .count();
    }

    // Helper method to get total semesters count
    public int getTotalSemestersCount() {
        return universities.size();
    }
}