package com.example.postfolio.postservice.post.dto;

import com.example.postfolio.postservice.post.models.PostType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import java.util.List;

@Getter
@RequiredArgsConstructor
public class GeminiResponse {
    private final PostType postType;
    private final List<String> tags;
} 