package com.example.postfolio.enrollments.dto;

import com.example.postfolio.enrollments.entity.Enrollment;
import jakarta.validation.constraints.NotNull;

public class UpdateEnrollmentStatusRequest {
    
    @NotNull(message = "Status is required")
    private Enrollment.EnrollmentStatus status;
    
    // Constructors
    public UpdateEnrollmentStatusRequest() {}
    
    public UpdateEnrollmentStatusRequest(Enrollment.EnrollmentStatus status) {
        this.status = status;
    }
    
    // Getters and Setters
    public Enrollment.EnrollmentStatus getStatus() {
        return status;
    }
    
    public void setStatus(Enrollment.EnrollmentStatus status) {
        this.status = status;
    }
    
    @Override
    public String toString() {
        return "UpdateEnrollmentStatusRequest{" +
                "status=" + status +
                '}';
    }
}
