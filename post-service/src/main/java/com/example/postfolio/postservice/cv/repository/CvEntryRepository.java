package com.example.postfolio.postservice.cv.repository;

import com.example.postfolio.postservice.cv.entity.CvEntry;
import com.example.postfolio.postservice.cv.model.CvType;
import com.example.postfolio.postservice.profile.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CvEntryRepository extends JpaRepository<CvEntry, Long> {

    List<CvEntry> findByProfile(Profile profile);

    List<CvEntry> findByProfileAndType(Profile profile, CvType type);

    void deleteByPostId(Long postId);

    Optional<CvEntry> findByProfileAndTypeAndContent(Profile profile, CvType type, String content);
} 