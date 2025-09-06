package com.example.postfolio.enrollments.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

public class UpdateEnrollmentRatingRequest {
    
    @DecimalMin(value = "1.0", message = "Rating must be at least 1.0")
    @DecimalMax(value = "5.0", message = "Rating must not exceed 5.0")
    private Double rating;
    
    // Constructors
    public UpdateEnrollmentRatingRequest() {}
    
    public UpdateEnrollmentRatingRequest(Double rating) {
        this.rating = rating;
    }
    
    // Getters and Setters
    public Double getRating() {
        return rating;
    }
    
    public void setRating(Double rating) {
        this.rating = rating;
    }
    
    @Override
    public String toString() {
        return "UpdateEnrollmentRatingRequest{" +
                "rating=" + rating +
                '}';
    }
}
