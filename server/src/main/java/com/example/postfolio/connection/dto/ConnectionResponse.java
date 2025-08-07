package com.example.postfolio.connection.dto;

import com.example.postfolio.connection.model.ConnectionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ConnectionResponse {
    private Long id;
    private Long requesterId;
    private String requesterName;
    private String requesterEmail;
    private Long requesterProfileId;
    private String requesterPictureBase64;
    private Long receiverId;
    private String receiverName;
    private String receiverEmail;
    private Long receiverProfileId;
    private String receiverPictureBase64;
    private ConnectionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}