package com.example.stripe.controllers;

import com.example.stripe.config.PaymentRequest;
import com.example.stripe.service.StripeService;
import com.stripe.exception.StripeException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class StripeController {

    private final StripeService stripeService;

    public StripeController(StripeService stripeService) {
        this.stripeService = stripeService;
    }

    @PostMapping("/charge")
    public ResponseEntity<Map<String, Object>> createPaymentIntent(@RequestBody PaymentRequest paymentRequest) {
        try {
            String clientSecret = stripeService.createPaymentIntent(paymentRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("clientSecret", clientSecret);

            return ResponseEntity.ok(response);

        } catch (StripeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}
