package com.example.postfolio.postservice.post.service;

import com.example.postfolio.postservice.post.entity.Post;
import com.example.postfolio.postservice.post.models.PostType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostAnalysisService {

    // In production, replace with real AI service (OpenAI/HuggingFace)
    private final MockAiService mockAiService;

    public Post analyzePost(String content) {
        AiResponse response = mockAiService.analyzeContent(content);
        return Post.builder()
                .content(content)
                .cvHeading(response.getSummary())
                .type(response.getPostType())
                .tags(response.getTags())
                .autoTagged(true)
                .build();
    }
} 