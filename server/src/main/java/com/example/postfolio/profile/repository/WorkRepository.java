package com.example.postfolio.profile.repository;

import com.example.postfolio.profile.entity.Profile;
import com.example.postfolio.profile.entity.Work;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkRepository extends JpaRepository<Work, Long> {
    
    List<Work> findByProfileOrderByStartDateDesc(Profile profile);
    
    List<Work> findByProfileAndIsCurrentTrue(Profile profile);
    
    List<Work> findByProfileAndIsCurrentFalse(Profile profile);
} 