package com.example.postfolio.post.entity;

import com.example.postfolio.post.models.PostType;
import com.example.postfolio.profile.entity.Profile;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private String cvHeading; // AI-generated summary for CV display (e.g., "React Dashboard Project")

    @Enumerated(EnumType.STRING)
    private PostType type;

    @ElementCollection
    @CollectionTable(name = "post_tags", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    // Image support - store up to 4 base64 encoded images
    @ElementCollection
    @CollectionTable(name = "post_images", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "image_data", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private Boolean autoTagged = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile profile;

    // Helper method to add image with validation
    public void addImage(String base64Image) {
        if (this.images.size() >= 4) {
            throw new IllegalStateException("Cannot add more than 4 images per post");
        }
        if (base64Image != null && !base64Image.trim().isEmpty()) {
            this.images.add(base64Image);
        }
    }

    // Helper method to check if post has images
    public boolean hasImages() {
        return images != null && !images.isEmpty();
    }

    // Helper method to get image count
    public int getImageCount() {
        return images != null ? images.size() : 0;
    }
}