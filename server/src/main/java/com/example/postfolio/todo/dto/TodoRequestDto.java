package com.example.postfolio.todo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record TodoRequestDto(
        @NotBlank(message = "Name cannot be blank")
        String name,
        
        @NotNull(message = "Profile ID cannot be null")
        Long profileId,
        
        LocalDateTime time
) {
}