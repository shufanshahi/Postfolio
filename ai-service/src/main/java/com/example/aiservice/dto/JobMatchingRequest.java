package com.example.aiservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobMatchingRequest implements Serializable {
    private Long jobId;
    private Long profileId;
    private String jobTitle;
    private String jobDescription;
    private String jobRequirements;
    private String jobSkills;
    private String jobExperience;
    private String jobLocation;

    private String profileBio;
    private String profilePosition;
    private String profileSkills;
    private String profileEducation;
    private String profileWorkExperience;
    private String profileLocation;

    // Education details from education service
    private String sscResult;
    private String hscResult;
    private String degreeName;
    private String cgpa;
}
