package com.example.postfolio.profile.entity;

import com.example.postfolio.profile.entity.Profile;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "schools")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class School {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_name", nullable = false)
    private String schoolName;

    @Column(name = "class_level", nullable = false)
    private Integer classLevel; // 1 to 12

    @Column(name = "academic_year")
    private String academicYear; // e.g., "2020-2021"

    @Column(name = "result")
    private String result; // GPA or Grade

    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    @JsonIgnore
    private Profile profile;

    // Helper method to check if this is SSC (class 10)
    public boolean isSSC() {
        return classLevel == 10;
    }

    // Helper method to check if this is HSC (class 12)
    public boolean isHSC() {
        return classLevel == 12;
    }

    // Helper method to get display name
    public String getDisplayName() {
        if (isSSC()) {
            return "SSC";
        } else if (isHSC()) {
            return "HSC";
        } else {
            return "Class " + classLevel;
        }
    }
}