package com.example.postfolio.todo.dto;

import com.example.postfolio.todo.enums.TodoStatus;
import java.time.LocalDateTime;

public record TodoDto(Long id, String name, Long profileId, LocalDateTime time, TodoStatus status) {
}