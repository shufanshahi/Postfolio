package com.example.postfolio.jobcandidates.entity;

import com.example.postfolio.jobcandidates.model.CandidateStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "job_candidates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobCandidate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "job_id", nullable = false)
    private Long jobId;
    
    @Column(name = "profile_id", nullable = false)
    private Long profileId;
    
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CandidateStatus status = CandidateStatus.OFF;
    
    @Column(name = "score")
    private Double score;
    
    @Column(name = "expire_date")
    private LocalDate expireDate;
}