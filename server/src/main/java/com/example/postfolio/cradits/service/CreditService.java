package com.example.postfolio.cradits.service;

import com.example.postfolio.cradits.dto.AddCreditRequest;
import com.example.postfolio.cradits.dto.CreditResponse;
import com.example.postfolio.cradits.dto.MakePurchaseRequest;
import com.example.postfolio.cradits.entity.Credit;
import com.example.postfolio.cradits.repository.CreditRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
