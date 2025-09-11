package com.example.postfolio.job.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class AutoSelectRequest {
    private String offerLetter;
    private Integer desiredSelectNumber;
    private LocalDate letterExpiry;
}