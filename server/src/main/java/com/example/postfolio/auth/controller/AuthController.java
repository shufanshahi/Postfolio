package com.example.postfolio.auth.controller;

import com.example.postfolio.auth.dto.AuthRequest;
import com.example.postfolio.auth.dto.AuthResponse;
import com.example.postfolio.auth.dto.RegisterRequest;
import com.example.postfolio.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    // Deprecated: This server no longer handles auth.
    @PostMapping("/register")
    public ResponseEntity<String> register() {
        return ResponseEntity.status(404).body("Auth moved to auth-service");
    }

    @PostMapping("/login")
    public ResponseEntity<String> login() {
        return ResponseEntity.status(404).body("Auth moved to auth-service");
    }
}
