package com.example.postfolio.interview.repository;

import com.example.postfolio.interview.entity.MockInterview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MockInterviewRepository extends JpaRepository<MockInterview, Long> {
    List<MockInterview> findByProfileId(Long profileId);
}
