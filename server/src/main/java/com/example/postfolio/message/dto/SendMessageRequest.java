package com.example.postfolio.message.dto;

import com.example.postfolio.message.entity.MessageType;
import lombok.Data;

@Data
public class SendMessageRequest {
    private Long conversationId;
    private String receiverEmail; // For new conversations
    private MessageType type;
    private String content; // Text or emoji
    private String imageData; // Base64 encoded image
    private String imageName;
    private String imageType;
}
