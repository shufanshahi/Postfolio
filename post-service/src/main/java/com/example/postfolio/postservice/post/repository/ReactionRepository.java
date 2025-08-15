package com.example.postfolio.postservice.post.repository;

import com.example.postfolio.postservice.post.entity.Reaction;
import com.example.postfolio.postservice.post.entity.Post;
import com.example.postfolio.postservice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    List<Reaction> findByPost(Post post);
    
    Optional<Reaction> findByPostAndUser(Post post, User user);
    
    @Query("SELECT r FROM Reaction r JOIN FETCH r.user WHERE r.post = :post")
    List<Reaction> findByPostWithUser(@Param("post") Post post);
    
    boolean existsByPostAndUser(Post post, User user);
} 