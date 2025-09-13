package com.example.postfolio.roadmap.entity;

import com.example.postfolio.roadmap.model.RoadmapItemType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "roadmap_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoadmapItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roadmap_id", nullable = false)
    private Roadmap roadmap;

    @Column(name = "day_date", nullable = false)
    private LocalDate dayDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoadmapItemType itemType;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(name = "resource_links", length = 2000)
    private String resourceLinks; // JSON string of links

    @Column(name = "video_links", length = 2000)
    private String videoLinks; // JSON string of video links

    @Column(name = "website_links", length = 2000)
    private String websiteLinks; // JSON string of website links

    @Column(name = "is_completed")
    @Builder.Default
    private Boolean isCompleted = false;

    @Column(name = "completion_notes", length = 500)
    private String completionNotes;

    @Column(name = "estimated_hours")
    private Integer estimatedHours;
}
