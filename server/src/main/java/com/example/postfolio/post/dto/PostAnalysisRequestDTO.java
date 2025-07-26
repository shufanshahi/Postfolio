package com.example.postfolio.post.dto;

import lombok.Data;

@Data
public class PostAnalysisRequestDTO {
    private String content;
    // Can add context like user's existing tags later
}