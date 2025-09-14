package com.example.postfolio.todo.dto;

import java.time.LocalDateTime;

public record TodoDto(Long id, String name, Long profileId, LocalDateTime time) {
}