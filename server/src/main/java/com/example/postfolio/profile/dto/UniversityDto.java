package com.example.postfolio.profile.dto;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UniversityDto {

    private Long id;
    private String universityName;
    private String degreeName;
    private Integer semesterNumber;
    private String academicYear;
    private String semesterResult;
    private Integer totalCredits;
    private LocalDate completionDate;
    private String transcriptUrl;
    private Boolean isCompleted;
    private String semesterDisplayName;
    private String academicLevel;

    // Helper method to get semester display name
    public String getSemesterDisplayName() {
        return "Semester " + semesterNumber;
    }

    // Helper method to get academic level
    public String getAcademicLevel() {
        if (semesterNumber <= 2) {
            return "1st Year";
        } else if (semesterNumber <= 4) {
            return "2nd Year";
        } else if (semesterNumber <= 6) {
            return "3rd Year";
        } else {
            return "4th Year";
        }
    }
}