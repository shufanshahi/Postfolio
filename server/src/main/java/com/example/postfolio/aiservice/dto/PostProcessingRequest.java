package com.example.postfolio.aiservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostProcessingRequest implements Serializable {
    private Long postId;
    private String content;
    private Long profileId;
    private String profileBio;
    private String profilePosition;
    private String profileSkills;
    private String profileEducation;
    private String profileWorkExperience;
}
