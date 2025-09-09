package com.example.postfolio.profile.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUniversityRequest {

    @NonNull
    private String universityName;

    @NonNull
    private String degreeName;

    @NonNull
    private Integer semesterCount;

    private List<Double> semesterResults;

    // Helper method to validate semester results
    public boolean isValidSemesterResults() {
        if (semesterResults == null || semesterCount == null) {
            return true; // Allow empty results initially
        }
        return semesterResults.size() <= semesterCount;
    }
}