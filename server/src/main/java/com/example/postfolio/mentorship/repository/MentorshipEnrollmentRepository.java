package com.example.postfolio.mentorship.repository;

import com.example.postfolio.mentorship.entity.MentorshipEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentorshipEnrollmentRepository extends JpaRepository<MentorshipEnrollment, Long> {
    
    List<MentorshipEnrollment> findByProfileId(Long profileId);
    List<MentorshipEnrollment> findByMentorshipId(Long mentorshipId);
    List<MentorshipEnrollment> findByStatus(MentorshipEnrollment.EnrollmentStatus status);
}
