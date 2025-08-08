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

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final ProfileService profileService;

    public AuthResponse register(RegisterRequest request) {
        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(request.role())
                .build();



        User savedUser = userRepository.save(user);
        profileService.initializeProfileForUser(savedUser);
        String jwt = jwtService.generateToken(user);
        return new AuthResponse(jwt, user.getRole(), user.getId());
    }

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String jwt = jwtService.generateToken(user);
        return new AuthResponse(jwt, user.getRole(), user.getId());
    }
}
