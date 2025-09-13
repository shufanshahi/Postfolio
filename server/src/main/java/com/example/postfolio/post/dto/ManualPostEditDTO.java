package com.example.postfolio.post.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualPostEditDTO {
    @NotNull
    private Long profileId;

    @NotNull
    private String category; // "ACHIEVEMENT", "PROJECT", "PROFESSIONAL_EXPERIENCE", "GENERAL"

    private List<String> skills; // For ACHIEVEMENT and PROJECT

    private String companyName; // For PROFESSIONAL_EXPERIENCE
    private String position; // For PROFESSIONAL_EXPERIENCE

    private String cvHeading; // Custom CV heading for ACHIEVEMENT and PROJECT
}