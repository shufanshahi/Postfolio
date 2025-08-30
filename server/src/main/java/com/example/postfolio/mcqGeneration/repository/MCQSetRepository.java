package com.example.postfolio.mcqGeneration.repository;

import com.example.postfolio.mcqGeneration.entity.MCQSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MCQSetRepository extends JpaRepository<MCQSet, Long> {
    List<MCQSet> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<MCQSet> findByUserId(Long userId);

    Optional<MCQSet> findByIdAndUserId(Long id, Long userId);
}