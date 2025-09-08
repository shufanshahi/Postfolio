package com.example.postfolio.profile.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolDto {

    private Long id;
    private String schoolName;
    private Integer classLevel;
    private String academicYear;
    private String result;
    private String displayName;

    // Helper method to get display name
    public String getDisplayName() {
        if (classLevel == 10) {
            return "SSC";
        } else if (classLevel == 12) {
            return "HSC";
        } else {
            return "Class " + classLevel;
        }
    }
}