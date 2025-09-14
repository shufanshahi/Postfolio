package com.example.postfolio.todo.repository;

import com.example.postfolio.todo.entity.Todo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TodoRepository extends JpaRepository<Todo, Long> {
    
    // Find all todos by profile ID
    List<Todo> findByProfileId(Long profileId);
    
    // Find todos by profile ID ordered by name
    @Query("SELECT t FROM Todo t WHERE t.profileId = :profileId ORDER BY t.name ASC")
    List<Todo> findByProfileIdOrderByName(@Param("profileId") Long profileId);
}