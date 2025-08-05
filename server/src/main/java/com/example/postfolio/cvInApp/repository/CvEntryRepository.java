package com.example.postfolio.cvInApp.repository;

import com.example.postfolio.cvInApp.entity.CvEntry;
import com.example.postfolio.cvInApp.model.CvType;
import com.example.postfolio.profile.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CvEntryRepository extends JpaRepository<CvEntry, Long> {

    List<CvEntry> findByProfile(Profile profile);

    List<CvEntry> findByProfileAndType(Profile profile, CvType type);

    void deleteByPostId(Long postId);

    Optional<CvEntry> findByProfileAndTypeAndContent(Profile profile, CvType type, String content);
}
