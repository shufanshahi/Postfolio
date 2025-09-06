package com.example.postfolio.enrollments.service;

import com.example.postfolio.enrollments.entity.Enrollment;
import com.example.postfolio.enrollments.repository.EnrollmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EnrollmentStatusSchedulerService {

    private final EnrollmentRepository enrollmentRepository;

    @Autowired
    public EnrollmentStatusSchedulerService(EnrollmentRepository enrollmentRepository) {
        this.enrollmentRepository = enrollmentRepository;
    }

    /**
     * Scheduled method that runs every 5 minutes to update enrollment statuses
     * - APPROVED -> ONGOING: When current time has passed the enrollment time
     * - ONGOING -> MISSED: When current time is 1 hour 15 minutes after enrollment time
     * - Does not change REFUNDED or COMPLETED statuses
     */
    @Scheduled(fixedRate = 300000) // 5 minutes = 300,000 milliseconds
    @Transactional
    public void updateEnrollmentStatuses() {
        LocalDateTime now = LocalDateTime.now();
        
        try {
            // Update APPROVED enrollments to ONGOING
            updateApprovedToOngoing(now);
            
            // Update ONGOING enrollments to MISSED
            updateOngoingToMissed(now);
            
        } catch (Exception e) {
            // Log the error but don't throw it to prevent scheduler from stopping
            System.err.println("Error updating enrollment statuses: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Update APPROVED enrollments to ONGOING when the scheduled time has passed
     */
    private void updateApprovedToOngoing(LocalDateTime now) {
        // Find all APPROVED enrollments where the scheduled time has passed
        List<Enrollment> approvedEnrollments = enrollmentRepository.findByStatusAndTimeBefore(
            Enrollment.EnrollmentStatus.APPROVED, 
            now
        );

        for (Enrollment enrollment : approvedEnrollments) {
            enrollment.setStatus(Enrollment.EnrollmentStatus.ONGOING);
            enrollmentRepository.save(enrollment);
        }

        if (!approvedEnrollments.isEmpty()) {
            System.out.println("Updated " + approvedEnrollments.size() + " enrollments from APPROVED to ONGOING");
        }
    }

    /**
     * Update ONGOING enrollments to MISSED when 1 hour 15 minutes have passed since the scheduled time
     */
    private void updateOngoingToMissed(LocalDateTime now) {
        // Calculate the cutoff time (1 hour 15 minutes ago)
        LocalDateTime cutoffTime = now.minusHours(1).minusMinutes(15);
        
        // Find all ONGOING enrollments where the scheduled time was more than 1:15 hours ago
        List<Enrollment> ongoingEnrollments = enrollmentRepository.findByStatusAndTimeBefore(
            Enrollment.EnrollmentStatus.ONGOING, 
            cutoffTime
        );

        for (Enrollment enrollment : ongoingEnrollments) {
            enrollment.setStatus(Enrollment.EnrollmentStatus.MISSED);
            enrollmentRepository.save(enrollment);
        }

        if (!ongoingEnrollments.isEmpty()) {
            System.out.println("Updated " + ongoingEnrollments.size() + " enrollments from ONGOING to MISSED");
        }
    }

    /**
     * Manual method to trigger status updates (useful for testing)
     */
    public void manualUpdateStatuses() {
        updateEnrollmentStatuses();
    }
}
