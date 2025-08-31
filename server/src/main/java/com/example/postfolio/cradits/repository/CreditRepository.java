package com.example.postfolio.cradits.repository;

import com.example.postfolio.cradits.entity.Credit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CreditRepository extends JpaRepository<Credit, Long> {
    
    /**
     * Find credit by profile ID
     * @param profileId the profile ID
     * @return Optional containing the credit if found
     */
    Optional<Credit> findByProfileId(Long profileId);
    
    /**
     * Check if credit exists for a profile
     * @param profileId the profile ID
     * @return true if credit exists, false otherwise
     */
    boolean existsByProfileId(Long profileId);
    
    /**
     * Delete credit by profile ID
     * @param profileId the profile ID
     */
    void deleteByProfileId(Long profileId);
    
    /**
     * Find credit by profile ID with transaction history
     * @param profileId the profile ID
     * @return Optional containing the credit with transaction history
     */
    @Query("SELECT c FROM Credit c LEFT JOIN FETCH c.transactionHistory WHERE c.profileId = :profileId")
    Optional<Credit> findByProfileIdWithTransactionHistory(@Param("profileId") Long profileId);
}
