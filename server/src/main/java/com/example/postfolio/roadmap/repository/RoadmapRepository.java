package com.example.postfolio.roadmap.repository;

import com.example.postfolio.roadmap.entity.Roadmap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoadmapRepository extends JpaRepository<Roadmap, Long> {

    @Query("SELECT r FROM Roadmap r WHERE r.jobId = :jobId AND r.profileId = :profileId")
    Optional<Roadmap> findByJobIdAndProfileId(@Param("jobId") Long jobId, @Param("profileId") Long profileId);

    @Query("SELECT r FROM Roadmap r WHERE r.profileId = :profileId ORDER BY r.createdAt DESC")
    List<Roadmap> findByProfileIdOrderByCreatedAtDesc(@Param("profileId") Long profileId);

    @Query("SELECT r FROM Roadmap r WHERE r.jobId = :jobId")
    List<Roadmap> findByJobId(@Param("jobId") Long jobId);

    @Query("SELECT COUNT(r) > 0 FROM Roadmap r WHERE r.jobId = :jobId AND r.profileId = :profileId")
    boolean existsByJobIdAndProfileId(@Param("jobId") Long jobId, @Param("profileId") Long profileId);
}
