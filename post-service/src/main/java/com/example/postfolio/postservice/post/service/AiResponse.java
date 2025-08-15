package com.example.postfolio.postservice.post.service;

import com.example.postfolio.postservice.post.models.PostType;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AiResponse {
    private String summary;
    private PostType postType;
    private List<String> tags;
} 