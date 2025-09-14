package com.example.postfolio.todo.service;

import com.example.postfolio.todo.dto.TodoDto;
import com.example.postfolio.todo.dto.TodoRequestDto;
import com.example.postfolio.todo.entity.Todo;
import com.example.postfolio.todo.repository.TodoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TodoService {
    
    private final TodoRepository todoRepository;
    
    // Get all todos
    public List<TodoDto> getAllTodos() {
        return todoRepository.findAll()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    // Get todos by profile ID
    public List<TodoDto> getTodosByProfileId(Long profileId) {
        return todoRepository.findByProfileIdOrderByName(profileId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    // Create a new todo
    public TodoDto createTodo(TodoRequestDto todoRequestDto) {
        Todo todo = Todo.builder()
                .name(todoRequestDto.name())
                .profileId(todoRequestDto.profileId())
                .build();
        
        Todo savedTodo = todoRepository.save(todo);
        return convertToDto(savedTodo);
    }
    
    // Helper method to convert entity to DTO
    private TodoDto convertToDto(Todo todo) {
        return new TodoDto(
                todo.getId(),
                todo.getName(),
                todo.getProfileId()
        );
    }
}