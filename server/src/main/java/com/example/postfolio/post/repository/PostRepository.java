package com.example.postfolio.post.repository;

import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.models.PostType;
import com.example.postfolio.profile.entity.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    // Find all posts by profile, sorted newest first
    List<Post> findByProfileOrderByCreatedAtDesc(Profile profile);

    // Paginated version of profile posts
    Page<Post> findByProfile(Profile profile, Pageable pageable);

    // Get latest posts across all profiles
    List<Post> findTop10ByOrderByCreatedAtDesc();

    // Count posts by profile
    long countByProfile(Profile profile);

    // Find posts by type (for CV section generation)
    List<Post> findByProfileAndTypeOrderByCreatedAtDesc(Profile profile, PostType type);

    // Search posts by AI-generated tags/skills
    List<Post> findByProfileAndTagsContaining(Profile profile, String tag);

    // Find posts needing human review (autoTagged = false)
    Page<Post> findByProfileAndAutoTaggedFalse(Profile profile, Pageable pageable);

    // NEW: Get all unique skills/tags for a profile
    @Query("SELECT DISTINCT t FROM Post p JOIN p.tags t WHERE p.profile.id = :profileId")
    List<String> findDistinctTagsByProfileId(Long profileId);

    // NEW: Find posts by multiple tags (AND condition)
    @Query("SELECT p FROM Post p WHERE p.profile = :profile AND :tag MEMBER OF p.tags")
    List<Post> findByProfileAndTag(Profile profile, String tag);

    // NEW: Count how many times a tag appears across a profile's posts
    @Query("SELECT COUNT(p) FROM Post p WHERE p.profile = :profile AND :tag MEMBER OF p.tags")
    long countByProfileAndTag(Profile profile, String tag);
}