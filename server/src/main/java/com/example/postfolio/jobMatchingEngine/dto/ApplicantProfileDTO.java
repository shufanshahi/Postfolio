package com.example.postfolio.jobMatchingEngine.dto;

import lombok.*;

import java.util.List;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicantProfileDTO {
    private String bio;
    private String positionOrInstitute;
    private List<String> education; // From schools and universities
    private List<String> experiences;
    private List<String> skills;
    private List<String> projects;
    private List<String> achievements;
}

