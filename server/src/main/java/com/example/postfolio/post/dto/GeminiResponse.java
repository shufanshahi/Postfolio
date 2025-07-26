package com.example.postfolio.post.dto;

import com.example.postfolio.post.models.PostType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import java.util.List;

@Getter
@RequiredArgsConstructor
public class GeminiResponse {
    private final PostType postType;
    private final List<String> tags;
}