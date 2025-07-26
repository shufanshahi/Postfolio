package com.example.postfolio.auth.dto;

import com.example.postfolio.user.model.Role;

public record RegisterRequest(
        String name,
        String email,
        String password,
        Role role
) {}

