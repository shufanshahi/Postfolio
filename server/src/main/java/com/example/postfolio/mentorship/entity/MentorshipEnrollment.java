package com.example.postfolio.mentorship.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "mentorship_enrollments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MentorshipEnrollment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long profileId;
    
    @Column(nullable = false)
    private Long mentorshipId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnrollmentStatus status;
    
    public enum EnrollmentStatus {
         APPROVED, COMPLETED, INACTIVE
    }
}
