package com.example.postfolio.profile.entity;

import com.example.postfolio.profile.entity.Profile;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "professional_experiences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfessionalExperience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_title", nullable = false)
    private String jobTitle;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "location")
    private String location;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_current_position")
    private Boolean isCurrentPosition = false;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "responsibilities", columnDefinition = "TEXT")
    private String responsibilities;

    @Column(name = "achievements", columnDefinition = "TEXT")
    private String achievements;

    @Column(name = "technologies_used")
    private String technologiesUsed;

    @ManyToOne
    @JoinColumn(name = "profile_id", nullable = false)
    @JsonIgnore
    private Profile profile;

    // Helper method to get duration
    public String getDuration() {
        LocalDate end = isCurrentPosition ? LocalDate.now() : endDate;
        if (end == null) return "Present";
        
        long years = java.time.Period.between(startDate, end).getYears();
        long months = java.time.Period.between(startDate, end).getMonths();
        
        if (years > 0 && months > 0) {
            return years + " year" + (years > 1 ? "s" : "") + " " + months + " month" + (months > 1 ? "s" : "");
        } else if (years > 0) {
            return years + " year" + (years > 1 ? "s" : "");
        } else if (months > 0) {
            return months + " month" + (months > 1 ? "s" : "");
        } else {
            return "Less than a month";
        }
    }

    // Helper method to get date range display
    public String getDateRange() {
        String startStr = startDate.getMonth().toString().substring(0, 3) + " " + startDate.getYear();
        if (isCurrentPosition) {
            return startStr + " - Present";
        } else if (endDate != null) {
            String endStr = endDate.getMonth().toString().substring(0, 3) + " " + endDate.getYear();
            return startStr + " - " + endStr;
        }
        return startStr + " - Present";
    }
} 