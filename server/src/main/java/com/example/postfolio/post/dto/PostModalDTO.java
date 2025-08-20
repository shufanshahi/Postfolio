package com.example.postfolio.post.dto;

import com.example.postfolio.post.models.PostType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostModalDTO {
    private Long id;
    private String content;
    private String cvHeading;
    private PostType type;
    private List<String> tags;
    private List<String> images;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean autoTagged;
    
    // User/Profile information
    private String userName;
    private String userProfilePicture;
    private String userPosition;
    private String userBio;
} 