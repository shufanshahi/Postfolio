package com.example.postfolio.mentorship.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "mentorships")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Mentorship {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String specialization;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MentorshipStatus status;
    
    @Column(nullable = false)
    private Double price;
    
    @Column(nullable = false)
    private Integer totalEnrolled = 0;
    
    @Column
    private Double rating = 0.0;
    
    @Column(nullable = false)
    private Long profileId;
    
    @ElementCollection
    @CollectionTable(name = "mentorship_enrolled_profiles", joinColumns = @JoinColumn(name = "mentorship_id"))
    @Column(name = "profile_id")
    private List<Long> enrolledIds = new ArrayList<>();
    
    public enum MentorshipStatus {
        ACTIVE, INACTIVE
    }
}
