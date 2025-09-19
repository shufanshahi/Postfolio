package com.example.postfolio.todo.service;

import com.example.postfolio.todo.dto.TodoDto;
import com.example.postfolio.todo.dto.TodoRequestDto;
import com.example.postfolio.todo.entity.Todo;
import com.example.postfolio.todo.enums.TodoStatus;
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
                .time(todoRequestDto.time())
                .status(todoRequestDto.status() != null ? todoRequestDto.status() : TodoStatus.UNCHECKED)
                .build();
        
        Todo savedTodo = todoRepository.save(todo);
        return convertToDto(savedTodo);
    }
    
    // Update todo by profile ID
    public TodoDto updateTodoByProfileId(Long profileId, TodoRequestDto todoRequestDto) {
        // Find existing todo for the profile
        List<Todo> existingTodos = todoRepository.findByProfileIdOrderByName(profileId);
        
        Todo todoToUpdate;
        if (!existingTodos.isEmpty()) {
            // Update the first todo found for this profile
            todoToUpdate = existingTodos.get(0);
            todoToUpdate.setName(todoRequestDto.name());
            todoToUpdate.setTime(todoRequestDto.time());
            // Only update status if provided, otherwise keep existing status
            if (todoRequestDto.status() != null) {
                todoToUpdate.setStatus(todoRequestDto.status());
            }
        } else {
            // Create new todo if none exists
            todoToUpdate = Todo.builder()
                    .name(todoRequestDto.name())
                    .profileId(profileId)
                    .time(todoRequestDto.time())
                    .status(todoRequestDto.status() != null ? todoRequestDto.status() : TodoStatus.UNCHECKED)
                    .build();
        }
        
        Todo savedTodo = todoRepository.save(todoToUpdate);
        return convertToDto(savedTodo);
    }
    
    // Update todo status by ID
    public TodoDto updateTodoStatus(Long todoId, String statusString) {
        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new RuntimeException("Todo not found with id: " + todoId));
        
        TodoStatus status = TodoStatus.valueOf(statusString.toUpperCase());
        todo.setStatus(status);
        
        Todo savedTodo = todoRepository.save(todo);
        return convertToDto(savedTodo);
    }
    
    // Helper method to convert entity to DTO
    private TodoDto convertToDto(Todo todo) {
        return new TodoDto(
                todo.getId(),
                todo.getName(),
                todo.getProfileId(),
                todo.getTime(),
                todo.getStatus()
        );
    }
}