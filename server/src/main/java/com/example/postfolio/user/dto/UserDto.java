package com.example.postfolio.user.dto;


import com.example.postfolio.user.model.Role;

public record UserDto(Long id, String name, String email, Role role) {}
