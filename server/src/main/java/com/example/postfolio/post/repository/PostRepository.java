package com.example.postfolio.post.repository;

import com.example.postfolio.post.entity.Post;
import com.example.postfolio.post.models.PostType;
import com.example.postfolio.profile.entity.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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

    // NEW: Find posts by type (for CV section generation)
    List<Post> findByProfileAndTypeOrderByCreatedAtDesc(Profile profile, PostType type);

    // NEW: Search posts by AI-generated tags
    List<Post> findByProfileAndTagsContaining(Profile profile, String tag);

    // NEW: Find posts needing human review (autoTagged = false)
    Page<Post> findByProfileAndAutoTaggedFalse(Profile profile, Pageable pageable);
}