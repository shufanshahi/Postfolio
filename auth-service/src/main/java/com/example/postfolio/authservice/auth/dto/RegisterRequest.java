package com.example.postfolio.authservice.auth.dto;

import com.example.postfolio.authservice.user.model.Role;

public record RegisterRequest(
        String name,
        String email,
        String password,
        Role role
) {}

