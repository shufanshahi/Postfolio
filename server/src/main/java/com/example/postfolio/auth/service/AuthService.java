package com.example.postfolio.auth.service;



import com.example.postfolio.auth.dto.AuthRequest;
import com.example.postfolio.auth.dto.AuthResponse;
import com.example.postfolio.auth.dto.RegisterRequest;
import com.example.postfolio.config.JwtService;
import com.example.postfolio.profile.service.ProfileService;
import com.example.postfolio.user.entity.User;
import com.example.postfolio.user.model.Role;
import com.example.postfolio.user.repository.UserRepository;
import com.example.postfolio.config.SecurityConfig;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    // Deprecated placeholder to avoid breaking injections if any remain.
}