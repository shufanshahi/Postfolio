package com.example.postfolio.search.controller;

import com.example.postfolio.search.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/users")
    public ResponseEntity<List<SearchService.UserSearchResult>> searchUsers(@RequestParam String q) {
        if (q == null || q.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        
        List<SearchService.UserSearchResult> results = searchService.searchUsers(q.trim());
        return ResponseEntity.ok(results);
    }
} 