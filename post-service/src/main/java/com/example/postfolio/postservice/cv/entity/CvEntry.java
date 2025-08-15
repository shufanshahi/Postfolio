package com.example.postfolio.postservice.cv.entity;

import com.example.postfolio.postservice.cv.model.CvType;
import com.example.postfolio.postservice.profile.entity.Profile;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cv_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CvEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which user this CV entry belongs to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile profile;

    // Type of CV section (EXPERIENCE, SKILL, etc.)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CvType type;

    // Main content to be shown in the CV section
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // If this entry came from a specific post (helps with updates/deletes)
    private Long postId;
} 