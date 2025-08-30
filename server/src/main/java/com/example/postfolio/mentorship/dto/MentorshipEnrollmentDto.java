package com.example.postfolio.mentorship.dto;

import com.example.postfolio.mentorship.entity.MentorshipEnrollment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MentorshipEnrollmentDto {
    
    private Long id;
    private Long profileId;
    private Long mentorshipId;
    private MentorshipEnrollment.EnrollmentStatus status;
}
