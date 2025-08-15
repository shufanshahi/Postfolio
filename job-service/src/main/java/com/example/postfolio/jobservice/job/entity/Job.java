package com.example.postfolio.jobservice.job.entity;

import com.example.postfolio.jobservice.job.model.JobStatus;
import com.example.postfolio.jobservice.user.entity.User;
import com.example.postfolio.jobservice.profile.entity.Profile;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long jobId;

    private String title;
    private String position;
    private String description;
    private LocalDate datePosted;
    private LocalDate endDate;
    private String requirements;

    @Enumerated(EnumType.STRING)
    private JobStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employer_id")
    private User employer;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "job_applicants",
        joinColumns = @JoinColumn(name = "job_id"),
        inverseJoinColumns = @JoinColumn(name = "applicant_id", referencedColumnName = "id")
    )
    @Builder.Default
    private List<Profile> applicants = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "job_selected_applicants",
        joinColumns = @JoinColumn(name = "job_id"),
        inverseJoinColumns = @JoinColumn(name = "selected_applicant_id", referencedColumnName = "id")
    )
    @Builder.Default
    private List<Profile> selectedApplicants = new ArrayList<>();
} 