package com.example.postfolio.interview.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "mock_interview")
@Data
public class MockInterview {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String role;
	private String experience;
	private String interviewType;
	private String numQuestions;
}
