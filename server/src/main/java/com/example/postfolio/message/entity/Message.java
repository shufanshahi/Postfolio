package com.example.postfolio.message.entity;

import com.example.postfolio.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageType type;

    @Column(columnDefinition = "TEXT")
    private String content; // Text content or emoji

    @Column(columnDefinition = "TEXT")
    private String imageData; // Base64 encoded image data - using TEXT for PostgreSQL

    @Column
    private String imageName; // Original image filename

    @Column
    private String imageType; // MIME type of the image

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column
    private boolean isRead;

    @Column
    private LocalDateTime readAt;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
        isRead = false;
    }
}
