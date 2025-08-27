package com.example.postfolio.profile.entity;

import com.example.postfolio.profile.entity.Profile;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "works")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Work {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "position", nullable = false)
    private String position;

    @Column(name = "location")
    private String location;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_current", nullable = false)
    private Boolean isCurrent = false;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

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
        if (isCurrent) {
            return startDate.getYear() + " - Present";
        } else if (endDate != null) {
            long years = java.time.temporal.ChronoUnit.YEARS.between(startDate, endDate);
            long months = java.time.temporal.ChronoUnit.MONTHS.between(startDate, endDate) % 12;
            
            if (years > 0 && months > 0) {
                return years + " year" + (years > 1 ? "s" : "") + " " + months + " month" + (months > 1 ? "s" : "");
            } else if (years > 0) {
                return years + " year" + (years > 1 ? "s" : "");
            } else {
                return months + " month" + (months > 1 ? "s" : "");
            }
        }
        return "Duration not specified";
    }

    // Helper method to get display date range
    public String getDisplayDateRange() {
        if (isCurrent) {
            return startDate.getMonth().toString().substring(0, 3) + " " + startDate.getYear() + " - Present";
        } else if (endDate != null) {
            return startDate.getMonth().toString().substring(0, 3) + " " + startDate.getYear() + 
                   " - " + endDate.getMonth().toString().substring(0, 3) + " " + endDate.getYear();
        }
        return startDate.getMonth().toString().substring(0, 3) + " " + startDate.getYear() + " - Present";
    }
} 