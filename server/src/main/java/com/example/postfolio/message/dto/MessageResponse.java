package com.example.postfolio.message.dto;

import com.example.postfolio.message.entity.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private MessageType type;
    private String content;
    private String imageData;
    private String imageName;
    private String imageType;
    private LocalDateTime timestamp;
    private boolean isRead;
    private LocalDateTime readAt;
}
