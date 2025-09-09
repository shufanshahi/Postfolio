package com.example.postfolio.profile.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

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

    @Column(name = "semester_count", nullable = false)
    private Integer semesterCount; // Total number of semesters for this degree

    @ElementCollection
    @CollectionTable(name = "university_semester_results", joinColumns = @JoinColumn(name = "university_id"))
    @Column(name = "semester_result")
    private List<Double> semesterResults; // Array of GPA results for each semester

    @Column(name = "cgpa")
    private Double cgpa; // Calculated CGPA for this degree

    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    @JsonIgnore
    private Profile profile;

    // Calculate CGPA from semester results
    public Double calculateCGPA() {
        if (semesterResults == null || semesterResults.isEmpty()) {
            return null;
        }

        List<Double> validGpas = semesterResults.stream()
                .filter(gpa -> gpa != null && gpa > 0)
                .collect(java.util.stream.Collectors.toList());

        if (validGpas.isEmpty()) {
            return null;
        }

        double sum = validGpas.stream().mapToDouble(Double::doubleValue).sum();
        return Math.round((sum / validGpas.size()) * 100.0) / 100.0; // Round to 2 decimal places
    }

    // Update CGPA when semester results change
    public void updateCGPA() {
        this.cgpa = calculateCGPA();
    }

    // Get completed semesters count
    public int getCompletedSemestersCount() {
        if (semesterResults == null) {
            return 0;
        }
        return (int) semesterResults.stream()
                .filter(gpa -> gpa != null && gpa > 0)
                .count();
    }

    // Check if degree is completed
    public boolean isDegreeCompleted() {
        return getCompletedSemestersCount() >= semesterCount;
    }

    // Get progress percentage
    public double getProgressPercentage() {
        if (semesterCount == null || semesterCount == 0) {
            return 0.0;
        }
        return (double) getCompletedSemestersCount() / semesterCount * 100.0;
    }

    // Helper method to get degree display name
    public String getDegreeDisplayName() {
        return degreeName + " - " + universityName;
    }

    // Add a semester result
    public void addSemesterResult(Double gpa) {
        if (semesterResults == null) {
            semesterResults = new java.util.ArrayList<>();
        }
        semesterResults.add(gpa);
        updateCGPA();
    }

    // Update a specific semester result
    public void updateSemesterResult(int semesterIndex, Double gpa) {
        if (semesterResults != null && semesterIndex >= 0 && semesterIndex < semesterResults.size()) {
            semesterResults.set(semesterIndex, gpa);
            updateCGPA();
        }
    }
}