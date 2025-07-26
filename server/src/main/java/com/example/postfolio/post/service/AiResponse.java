package com.example.postfolio.post.service;

import com.example.postfolio.post.models.PostType;
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