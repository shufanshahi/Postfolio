package com.example.postfolio.todo.controller;

import com.example.postfolio.todo.dto.TodoDto;
import com.example.postfolio.todo.dto.TodoRequestDto;
import com.example.postfolio.todo.service.TodoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/todos")
@RequiredArgsConstructor
//@CrossOrigin(origins = "*")
@Slf4j
public class TodoController {
    
    private final TodoService todoService;
    
    // GET /api/todos - Get all todos
    @GetMapping
    public ResponseEntity<List<TodoDto>> getAllTodos() {
        try {
            List<TodoDto> todos = todoService.getAllTodos();
            return ResponseEntity.ok(todos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // GET /api/todos/profile/{profileId} - Get todos by profile ID
    @GetMapping("/profile/{profileId}")
    public ResponseEntity<List<TodoDto>> getTodosByProfileId(@PathVariable Long profileId) {
        try {
            List<TodoDto> todos = todoService.getTodosByProfileId(profileId);
            return ResponseEntity.ok(todos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // POST /api/todos - Create a new todo
    @PostMapping
    public ResponseEntity<TodoDto> createTodo(@Valid @RequestBody TodoRequestDto todoRequestDto) {
        try {
            TodoDto createdTodo = todoService.createTodo(todoRequestDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdTodo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}