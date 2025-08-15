package com.example.postfolio.authservice.auth.service;

import com.example.postfolio.authservice.auth.dto.AuthRequest;
import com.example.postfolio.authservice.auth.dto.AuthResponse;
import com.example.postfolio.authservice.auth.dto.RegisterRequest;
import com.example.postfolio.authservice.config.JwtService;
import com.example.postfolio.authservice.user.entity.User;
import com.example.postfolio.authservice.profile.entity.Profile;
import com.example.postfolio.authservice.profile.repository.ProfileRepository;
import com.example.postfolio.authservice.user.repository.UserRepository;
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
    private final ProfileRepository profileRepository;

    public AuthResponse register(RegisterRequest request) {
        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(request.role())
                .build();

        User savedUser = userRepository.save(user);
        profileRepository.findByUser(savedUser).orElseGet(() -> {
            Profile profile = new Profile();
            profile.setUser(savedUser);
            return profileRepository.save(profile);
        });
        String jwt = jwtService.generateToken(savedUser);
        return new AuthResponse(jwt);
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
        return new AuthResponse(jwt);
    }
}

