package com.example.postfolio.cradits.service;

import com.example.postfolio.cradits.dto.AddCreditRequest;
import com.example.postfolio.cradits.dto.CreditResponse;
import com.example.postfolio.cradits.dto.MakePurchaseRequest;
import com.example.postfolio.cradits.dto.TransferCreditRequest;
import com.example.postfolio.cradits.dto.TransferCreditResponse;
import com.example.postfolio.cradits.entity.Credit;
import com.example.postfolio.cradits.repository.CreditRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class CreditService {
    
    private final CreditRepository creditRepository;
    
    @Autowired
    public CreditService(CreditRepository creditRepository) {
        this.creditRepository = creditRepository;
    }
    
    /**
     * Get credit information by profile ID
     * @param profileId the profile ID
     * @return CreditResponse containing credit information
     * @throws RuntimeException if credit not found
     */
    @Transactional(readOnly = true)
    public CreditResponse getCreditByProfileId(Long profileId) {
        Optional<Credit> creditOptional = creditRepository.findByProfileIdWithTransactionHistory(profileId);
        
        if (creditOptional.isPresent()) {
            return new CreditResponse(creditOptional.get());
        } else {
            // Create new credit account if doesn't exist
            Credit newCredit = new Credit(profileId);
            newCredit.addTransaction("Account created with initial balance: 0.00");
            Credit savedCredit = creditRepository.save(newCredit);
            return new CreditResponse(savedCredit);
        }
    }
    
    /**
     * Add credit to a profile
     * @param request the add credit request
     * @return CreditResponse containing updated credit information
     * @throws RuntimeException if amount is invalid
     */
    public CreditResponse addCredit(AddCreditRequest request) {
        validateAmount(request.getAmount());
        
        Optional<Credit> creditOptional = creditRepository.findByProfileId(request.getProfileId());
        Credit credit;
        
        if (creditOptional.isPresent()) {
            credit = creditOptional.get();
        } else {
            credit = new Credit(request.getProfileId());
            credit.addTransaction("Account created");
        }
        
        credit.addCredit(request.getAmount(), request.getDescription());
        Credit savedCredit = creditRepository.save(credit);
        
        return new CreditResponse(savedCredit);
    }
    
    /**
     * Make a purchase (deduct credit from a profile)
     * @param request the purchase request
     * @return CreditResponse containing updated credit information
     * @throws RuntimeException if insufficient balance or amount is invalid
     */
    public CreditResponse makePurchase(MakePurchaseRequest request) {
        validateAmount(request.getAmount());
        
        Optional<Credit> creditOptional = creditRepository.findByProfileId(request.getProfileId());
        
        if (creditOptional.isEmpty()) {
            throw new RuntimeException("Credit account not found for profile ID: " + request.getProfileId());
        }
        
        Credit credit = creditOptional.get();
        
        if (!credit.deductCredit(request.getAmount(), request.getDescription())) {
            throw new RuntimeException("Insufficient credit balance. Available: " + credit.getTotalCredit() + 
                                     ", Required: " + request.getAmount());
        }
        
        Credit savedCredit = creditRepository.save(credit);
        return new CreditResponse(savedCredit);
    }
    
    /**
     * Check if a profile has sufficient credit
     * @param profileId the profile ID
     * @param requiredAmount the required amount
     * @return true if sufficient credit, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean hasSufficientCredit(Long profileId, BigDecimal requiredAmount) {
        Optional<Credit> creditOptional = creditRepository.findByProfileId(profileId);
        
        if (creditOptional.isEmpty()) {
            return false;
        }
        
        return creditOptional.get().getTotalCredit().compareTo(requiredAmount) >= 0;
    }
    
    /**
     * Get current credit balance for a profile
     * @param profileId the profile ID
     * @return current credit balance
     */
    @Transactional(readOnly = true)
    public BigDecimal getCurrentBalance(Long profileId) {
        Optional<Credit> creditOptional = creditRepository.findByProfileId(profileId);
        return creditOptional.map(Credit::getTotalCredit).orElse(BigDecimal.ZERO);
    }
    
    /**
     * Transfer credit from one profile to another
     * @param request the transfer request
     * @return TransferCreditResponse containing transfer details and updated balances
     * @throws RuntimeException if insufficient balance, profiles not found, or amount is invalid
     */
    public TransferCreditResponse transferCredit(TransferCreditRequest request) {
        // Validate inputs
        validateAmount(request.getAmount());
        
        if (request.getFromProfileId() == null) {
            throw new RuntimeException("From profile ID cannot be null");
        }
        if (request.getToProfileId() == null) {
            throw new RuntimeException("To profile ID cannot be null");
        }
        if (request.getFromProfileId().equals(request.getToProfileId())) {
            throw new RuntimeException("Cannot transfer credit to the same profile");
        }
        
        LocalDateTime transferDateTime = LocalDateTime.now();
        String transferDescription = request.getDescription() != null && !request.getDescription().trim().isEmpty() 
                                   ? request.getDescription() 
                                   : "Credit transfer";
        
        // Get or create from profile credit account
        Optional<Credit> fromCreditOptional = creditRepository.findByProfileId(request.getFromProfileId());
        Credit fromCredit;
        if (fromCreditOptional.isPresent()) {
            fromCredit = fromCreditOptional.get();
        } else {
            throw new RuntimeException("Credit account not found for sender profile ID: " + request.getFromProfileId());
        }
        
        // Check if sender has sufficient balance
        if (fromCredit.getTotalCredit().compareTo(request.getAmount()) < 0) {
            throw new RuntimeException("Insufficient credit balance. Available: " + fromCredit.getTotalCredit() + 
                                     ", Required: " + request.getAmount());
        }
        
        // Get or create to profile credit account
        Optional<Credit> toCreditOptional = creditRepository.findByProfileId(request.getToProfileId());
        Credit toCredit;
        if (toCreditOptional.isPresent()) {
            toCredit = toCreditOptional.get();
        } else {
            // Create new credit account for receiver if doesn't exist
            toCredit = new Credit(request.getToProfileId());
            toCredit.addTransaction("Account created");
        }
        
        // Perform the transfer
        String fromTransactionDesc =  transferDescription;
        String toTransactionDesc =  transferDescription;
        
        // Deduct from sender
        fromCredit.deductCredit(request.getAmount(), fromTransactionDesc);
        
        // Add to receiver
        toCredit.addCredit(request.getAmount(), toTransactionDesc);
        
        // Save both credit accounts
        Credit savedFromCredit = creditRepository.save(fromCredit);
        Credit savedToCredit = creditRepository.save(toCredit);
        
        // Create and return response
        return new TransferCreditResponse(
            request.getFromProfileId(),
            request.getToProfileId(),
            request.getAmount(),
            transferDescription,
            savedFromCredit.getTotalCredit(),
            savedToCredit.getTotalCredit(),
            transferDateTime,
            "SUCCESS"
        );
    }
    
    /**
     * Validate amount (must be positive and not null)
     * @param amount the amount to validate
     * @throws RuntimeException if amount is invalid
     */
    private void validateAmount(BigDecimal amount) {
        if (amount == null) {
            throw new RuntimeException("Amount cannot be null");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Amount must be greater than zero");
        }
        if (amount.scale() > 2) {
            throw new RuntimeException("Amount cannot have more than 2 decimal places");
        }
    }
}
