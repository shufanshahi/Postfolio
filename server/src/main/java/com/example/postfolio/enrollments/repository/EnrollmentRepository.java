package com.example.postfolio.enrollments.repository;

import com.example.postfolio.enrollments.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    
    /**
     * Find all enrollments by profile ID
     */
    List<Enrollment> findByProfileId(Long profileId);
    
    /**
     * Find all enrollments by mentorship ID
     */
    List<Enrollment> findByMentorshipId(Long mentorshipId);
    
    /**
     * Find all enrollments by profile ID and status
     */
    List<Enrollment> findByProfileIdAndStatus(Long profileId, Enrollment.EnrollmentStatus status);
    
    /**
     * Find all enrollments by mentorship ID and status
     */
    List<Enrollment> findByMentorshipIdAndStatus(Long mentorshipId, Enrollment.EnrollmentStatus status);
    
    /**
     * Find enrollment by profile ID and mentorship ID
     */
    Optional<Enrollment> findByProfileIdAndMentorshipId(Long profileId, Long mentorshipId);
    
    /**
     * Find all enrollments by status
     */
    List<Enrollment> findByStatus(Enrollment.EnrollmentStatus status);
    
    /**
     * Check if a profile is already enrolled in a mentorship
     */
    boolean existsByProfileIdAndMentorshipId(Long profileId, Long mentorshipId);
    
    /**
     * Count enrollments by mentorship ID
     */
    long countByMentorshipId(Long mentorshipId);
    
    /**
     * Count enrollments by profile ID
     */
    long countByProfileId(Long profileId);
    
    /**
     * Get enrollments by profile ID ordered by creation time (most recent first)
     */
    List<Enrollment> findByProfileIdOrderByTimeDesc(Long profileId);
    
    /**
     * Get enrollments by mentorship ID ordered by creation time (most recent first)
     */
    List<Enrollment> findByMentorshipIdOrderByTimeDesc(Long mentorshipId);
    
    /**
     * Find enrollments by profile ID and multiple statuses
     */
    @Query("SELECT e FROM Enrollment e WHERE e.profileId = :profileId AND e.status IN :statuses")
    List<Enrollment> findByProfileIdAndStatusIn(@Param("profileId") Long profileId, 
                                                @Param("statuses") List<Enrollment.EnrollmentStatus> statuses);
    
    /**
     * Find enrollments by mentorship ID and multiple statuses
     */
    @Query("SELECT e FROM Enrollment e WHERE e.mentorshipId = :mentorshipId AND e.status IN :statuses")
    List<Enrollment> findByMentorshipIdAndStatusIn(@Param("mentorshipId") Long mentorshipId, 
                                                   @Param("statuses") List<Enrollment.EnrollmentStatus> statuses);
}
