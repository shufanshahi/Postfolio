package com.example.postfolio.profile.entity;



import com.example.postfolio.profile.entity.Profile;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

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

    @Column(name = "academic_year", nullable = false)
    private String academicYear; // e.g., "2020-2021"

    @Column(name = "result", nullable = false)
    private String result; // GPA or Grade

    @Column(name = "result_type")
    private String resultType; // "SSC", "HSC", or regular class result

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Column(name = "certificate_url")
    private String certificateUrl;

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