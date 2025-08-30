package com.example.postfolio.mentorship.dto;

import com.example.postfolio.mentorship.entity.Mentorship;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MentorshipDto {
    
    private Long id;
    private String name;
    private String specialization;
    private Mentorship.MentorshipStatus status;
    private Double price;
    private Integer totalEnrolled;
    private Double rating;
    private Long profileId;
    private List<Long> enrolledIds;
}
