package com.example.postfolio.cradits.controller;

import com.example.postfolio.cradits.dto.AddCreditRequest;
import com.example.postfolio.cradits.dto.CreditResponse;
import com.example.postfolio.cradits.dto.MakePurchaseRequest;
import com.example.postfolio.cradits.dto.TransferCreditRequest;
import com.example.postfolio.cradits.dto.TransferCreditResponse;
import com.example.postfolio.cradits.service.CreditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/credits")
@CrossOrigin(origins = "*")
public class CreditController {
    
    private final CreditService creditService;
    
    @Autowired
    public CreditController(CreditService creditService) {
        this.creditService = creditService;
    }
    
    /**
     * Get credit information by profile ID
     * @param profileId the profile ID
     * @return ResponseEntity containing credit information
     */
    @GetMapping("/profile/{profileId}")
    public ResponseEntity<?> getCreditByProfileId(@PathVariable Long profileId) {
        try {
            CreditResponse creditResponse = creditService.getCreditByProfileId(profileId);
            return ResponseEntity.ok(creditResponse);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch credit information: " + e.getMessage()));
        }
    }
    
    /**
     * Add credit to a profile
     * @param request the add credit request
     * @return ResponseEntity containing updated credit information
     */
    @PostMapping("/add")
    public ResponseEntity<?> addCredit(@RequestBody AddCreditRequest request) {
        try {
            // Validate request
            if (request.getProfileId() == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Profile ID is required"));
            }
            if (request.getAmount() == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Amount is required"));
            }
            if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
                request.setDescription("Credit added");
            }
            
            CreditResponse creditResponse = creditService.addCredit(request);
            return ResponseEntity.ok(creditResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to add credit: " + e.getMessage()));
        }
    }
    
    /**
     * Make a purchase (deduct credit)
     * @param request the purchase request
     * @return ResponseEntity containing updated credit information
     */
    @PostMapping("/purchase")
    public ResponseEntity<?> makePurchase(@RequestBody MakePurchaseRequest request) {
        try {
            // Validate request
            if (request.getProfileId() == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Profile ID is required"));
            }
            if (request.getAmount() == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Amount is required"));
            }
            if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
                request.setDescription("Purchase made");
            }
            
            CreditResponse creditResponse = creditService.makePurchase(request);
            return ResponseEntity.ok(creditResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to process purchase: " + e.getMessage()));
        }
    }
    
    /**
     * Transfer credit between profiles
     * @param request the transfer request
     * @return ResponseEntity containing transfer details and updated balances
     */
    @PostMapping("/transfer")
    public ResponseEntity<?> transferCredit(@RequestBody TransferCreditRequest request) {
        try {
            // Validate request
            if (request.getFromProfileId() == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("From profile ID is required"));
            }
            if (request.getToProfileId() == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("To profile ID is required"));
            }
            if (request.getAmount() == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Amount is required"));
            }
            if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
                request.setDescription("Credit transfer");
            }
            
            TransferCreditResponse transferResponse = creditService.transferCredit(request);
            return ResponseEntity.ok(transferResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to process transfer: " + e.getMessage()));
        }
    }
    
    /**
     * Check if profile has sufficient credit
     * @param profileId the profile ID
     * @param amount the required amount
     * @return ResponseEntity containing balance check result
     */
    @GetMapping("/check-balance/{profileId}")
    public ResponseEntity<?> checkSufficientCredit(
            @PathVariable Long profileId,
            @RequestParam BigDecimal amount) {
        try {
            boolean hasSufficientCredit = creditService.hasSufficientCredit(profileId, amount);
            BigDecimal currentBalance = creditService.getCurrentBalance(profileId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("profileId", profileId);
            response.put("currentBalance", currentBalance);
            response.put("requiredAmount", amount);
            response.put("hasSufficientCredit", hasSufficientCredit);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to check balance: " + e.getMessage()));
        }
    }
    
    /**
     * Get current balance for a profile
     * @param profileId the profile ID
     * @return ResponseEntity containing current balance
     */
    @GetMapping("/balance/{profileId}")
    public ResponseEntity<?> getCurrentBalance(@PathVariable Long profileId) {
        try {
            BigDecimal currentBalance = creditService.getCurrentBalance(profileId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("profileId", profileId);
            response.put("currentBalance", currentBalance);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch balance: " + e.getMessage()));
        }
    }
    
    /**
     * Create error response map
     * @param message the error message
     * @return error response map
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", true);
        errorResponse.put("message", message);
        errorResponse.put("timestamp", System.currentTimeMillis());
        return errorResponse;
    }
}
