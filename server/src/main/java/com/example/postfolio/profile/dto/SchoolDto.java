package com.example.postfolio.profile.dto;



import lombok.*;

import java.time.LocalDate;

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
    private String resultType;
    private LocalDate completionDate;
    private String certificateUrl;
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