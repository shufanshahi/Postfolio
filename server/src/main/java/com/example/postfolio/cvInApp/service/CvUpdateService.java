package com.example.postfolio.cvInApp.service;

import com.example.postfolio.cvInApp.entity.CvEntry;
import com.example.postfolio.cvInApp.model.CvType;
import com.example.postfolio.cvInApp.repository.CvEntryRepository;
import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.models.PostType;
import com.example.postfolio.profile.entity.Profile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CvUpdateService {

    private final CvEntryRepository cvEntryRepository;

    @Transactional
    public void updateCvFromPost(Post post) {
        Profile profile = post.getProfile();
        PostType postType = post.getType();

        // Skill-only post: no cvHeading, just tags
        if (postType == PostType.SKILL) {
            addTagsAsSkills(post);
            return;
        }

        // Other types: add section + tags
        CvType cvType = mapPostTypeToCvType(postType);
        if (cvType != null && post.getCvHeading() != null) {
            // Remove previous entry from this post if any
            cvEntryRepository.deleteByPostId(post.getId());

            CvEntry cvEntry = CvEntry.builder()
                    .profile(profile)
                    .type(cvType)
                    .content(post.getCvHeading())
                    .postId(post.getId())
                    .build();

            cvEntryRepository.save(cvEntry);
        }

        // Add tags to SKILL section
        addTagsAsSkills(post);
    }

    @Transactional
    public void removeCvEntriesByPostId(Long postId) {
        cvEntryRepository.deleteByPostId(postId);
    }

    @Transactional(readOnly = true)
    public List<CvEntry> getCvEntriesByProfile(Profile profile) {
        return cvEntryRepository.findByProfile(profile);
    }

    private void addTagsAsSkills(Post post) {
        if (post.getTags() == null || post.getTags().isEmpty()) return;

        Profile profile = post.getProfile();
        Set<String> existingSkills = cvEntryRepository
                .findByProfileAndType(profile, CvType.SKILL)
                .stream()
                .map(CvEntry::getContent)
                .collect(Collectors.toSet());

        for (String tag : post.getTags()) {
            if (!existingSkills.contains(tag)) {
                CvEntry skillEntry = CvEntry.builder()
                        .profile(profile)
                        .type(CvType.SKILL)
                        .content(tag)
                        .postId(post.getId()) // Optional but useful
                        .build();
                cvEntryRepository.save(skillEntry);
            }
        }
    }

    private CvType mapPostTypeToCvType(PostType postType) {
        return switch (postType) {
            case EXPERIENCE -> CvType.EXPERIENCE;
            case PROJECT -> CvType.PROJECT;
            case ACHIEVEMENT -> CvType.ACHIEVEMENT;
            default -> null;
        };
    }
}
