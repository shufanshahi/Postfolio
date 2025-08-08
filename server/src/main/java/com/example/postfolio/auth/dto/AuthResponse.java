package com.example.postfolio.auth.dto;

import com.example.postfolio.user.model.Role;

public record AuthResponse(String token, Role role) {
}
