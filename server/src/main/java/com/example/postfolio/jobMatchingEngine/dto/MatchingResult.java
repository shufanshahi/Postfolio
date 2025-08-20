package com.example.postfolio.jobMatchingEngine.dto;
import java.util.List;

import lombok.*;



@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchingResult {
    private int totalScore;
    private int skillsScore;
    private int experienceScore;
    private int educationScore;
    private int additionalScore;
    private String explanation;
    private List<String> strengths;
    private List<String> gaps;
}
