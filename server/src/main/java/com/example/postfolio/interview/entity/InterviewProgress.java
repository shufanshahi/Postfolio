package com.example.postfolio.interview.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "interview_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "profile_id", nullable = false)
    private Long profileId;

    @Column(name = "mock_interview_id", nullable = false)
    private Long mockInterviewId;

    @Column(nullable = false)
    private LocalDateTime time;

    @Column
    private Double score;

    @ElementCollection
    @CollectionTable(name = "interview_progress_weaknesses", joinColumns = @JoinColumn(name = "interview_progress_id"))
    @Column(name = "weakness")
    private List<String> weaknesses;

    @ElementCollection
    @CollectionTable(name = "interview_progress_improvements", joinColumns = @JoinColumn(name = "interview_progress_id"))
    @Column(name = "improvement")
    private List<String> improvements;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (time == null) {
            time = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
