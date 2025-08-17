package com.example.postfolio.profile.entity;

import com.example.postfolio.profile.entity.Profile;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "universities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class University {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "university_name", nullable = false)
    private String universityName;

    @Column(name = "degree_name", nullable = false)
    private String degreeName; // e.g., "BSc in Computer Science"

    @Column(name = "semester_number", nullable = false)
    private Integer semesterNumber; // 1 to 8

    @Column(name = "academic_year", nullable = false)
    private String academicYear; // e.g., "2020-2021"

    @Column(name = "semester_result", nullable = false)
    private String semesterResult; // GPA or Grade

    @Column(name = "total_credits")
    private Integer totalCredits;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Column(name = "transcript_url")
    private String transcriptUrl;

    @Column(name = "is_completed")
    private Boolean isCompleted = false;

    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    @JsonIgnore
    private Profile profile;

    // Helper method to get semester display name
    public String getSemesterDisplayName() {
        return "Semester " + semesterNumber;
    }

    // Helper method to check if this is the final semester
    public boolean isFinalSemester() {
        return semesterNumber == 8;
    }

    // Helper method to get academic level
    public String getAcademicLevel() {
        if (semesterNumber <= 2) {
            return "1st Year";
        } else if (semesterNumber <= 4) {
            return "2nd Year";
        } else if (semesterNumber <= 6) {
            return "3rd Year";
        } else {
            return "4th Year";
        }
    }
}