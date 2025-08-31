package com.example.postfolio.mentorship.repository;

import com.example.postfolio.mentorship.entity.Mentorship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MentorshipRepository extends JpaRepository<Mentorship, Long> {
    
    /**
     * Find all mentorships by profile ID
     */
    List<Mentorship> findByProfileId(Long profileId);
    
    /**
     * Find all active mentorships
     */
    List<Mentorship> findByStatus(Mentorship.MentorshipStatus status);
    
    /**
     * Find all mentorships by profile ID and status
     */
    List<Mentorship> findByProfileIdAndStatus(Long profileId, Mentorship.MentorshipStatus status);
    
    /**
     * Find mentorships where a specific profile ID is enrolled
     */
    @Query("SELECT m FROM Mentorship m JOIN m.enrolledProfileIds e WHERE e = :profileId")
    List<Mentorship> findByEnrolledProfileId(@Param("profileId") Long profileId);
    
    /**
     * Check if a profile is already enrolled in a mentorship
     */
    @Query("SELECT COUNT(m) > 0 FROM Mentorship m JOIN m.enrolledProfileIds e WHERE m.id = :mentorshipId AND e = :profileId")
    boolean isProfileEnrolledInMentorship(@Param("mentorshipId") Long mentorshipId, @Param("profileId") Long profileId);
    
    /**
     * Find mentorships by repeat status
     */
    List<Mentorship> findByRepeatStatus(Boolean repeatStatus);
    
    /**
     * Find mentorships with rating greater than or equal to specified value
     */
    List<Mentorship> findByRatingGreaterThanEqual(Double rating);
    
    /**
     * Find mentorships by price range
     */
    List<Mentorship> findByPriceBetween(Double minPrice, Double maxPrice);
    
    /**
     * Count enrolled profiles for a mentorship
     */
    @Query("SELECT SIZE(m.enrolledProfileIds) FROM Mentorship m WHERE m.id = :mentorshipId")
    Integer countEnrolledProfiles(@Param("mentorshipId") Long mentorshipId);
}
