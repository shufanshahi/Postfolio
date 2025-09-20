package com.example.aiservice.service;

import com.example.aiservice.dto.GroqRequest;
import com.example.aiservice.dto.GroqResponse;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class GroqAIService {

    private final WebClient webClient;
    private final Gson gson;
    
    private static final String GROQ_API_KEY = "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";
    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    
    public GroqAIService() {
        this.webClient = WebClient.builder()
                .baseUrl(GROQ_API_URL)
                .build();
        this.gson = new Gson();
    }

    public GroqResponse processQuery(GroqRequest request) {
        log.info("Processing Groq query: {}", request.getQuestion());
        
        // Use available Groq model names from the API
        String[] modelNames = {
            "llama-3.3-70b-versatile",        // Latest Llama model
            "deepseek-r1-distill-llama-70b",  // DeepSeek model
            "llama-3.1-8b-instant",           // Fastest Llama model
            "gemma2-9b-it",                   // Google Gemma model
            "qwen/qwen3-32b"                  // Qwen model
        };
        
        for (String modelName : modelNames) {
            try {
                log.info("Trying model: {}", modelName);
                String answer = tryGroqRequest(request.getQuestion(), request.getContext(), modelName);
                return GroqResponse.builder()
                        .answer(answer)
                        .model(modelName)
                        .success(true)
                        .build();
            } catch (Exception e) {
                log.error("Model {} failed: {}", modelName, e.getMessage());
                // Continue to next model
            }
        }
        
        return GroqResponse.builder()
                .answer("I apologize, but I encountered an error while generating the answer. Please try again.")
                .success(false)
                .error("All models failed to generate response")
                .build();
    }
    
    private String tryGroqRequest(String question, String context, String modelName) {
        try {
            // Prepare the request payload for Groq API
            JsonObject requestBody = new JsonObject();
            requestBody.addProperty("model", modelName);
            
            JsonArray messages = new JsonArray();
            
            // System message
            JsonObject systemMessage = new JsonObject();
            systemMessage.addProperty("role", "system");
            systemMessage.addProperty("content", 
                "You are a helpful assistant that answers questions based on the provided context. " +
                "Use only the information from the context to answer questions. " +
                "If the context doesn't contain enough information, say so clearly. " +
                "Keep your answers concise and relevant.");
            messages.add(systemMessage);
            
            // User message with context and question
            JsonObject userMessage = new JsonObject();
            userMessage.addProperty("role", "user");
            userMessage.addProperty("content", 
                "Context:\n" + context + "\n\nQuestion: " + question);
            messages.add(userMessage);
            
            requestBody.add("messages", messages);
            requestBody.addProperty("max_tokens", 500);
            requestBody.addProperty("temperature", 0.1);

            // Log the request for debugging
            log.debug("Trying Groq model: {}", modelName);
            log.debug("Groq API Request: {}", gson.toJson(requestBody));

            // Make API call with error handling
            Mono<String> response = webClient.post()
                    .header("Authorization", "Bearer " + GROQ_API_KEY)
                    .header("Content-Type", "application/json")
                    .bodyValue(gson.toJson(requestBody))
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .doOnNext(errorBody -> log.error("Groq API Error Response: {}", errorBody))
                                    .then(Mono.error(new RuntimeException("Groq API Error: " + clientResponse.statusCode()))))
                    .bodyToMono(String.class);

            String responseBody = response.block();
            log.debug("Groq API Response: {}", responseBody);
            
            // Parse response
            JsonObject responseJson = gson.fromJson(responseBody, JsonObject.class);
            String answer = responseJson.getAsJsonArray("choices")
                    .get(0).getAsJsonObject()
                    .getAsJsonObject("message")
                    .get("content").getAsString();
            
            log.info("Successfully used model: {}", modelName);
            return answer;
                    
        } catch (Exception e) {
            log.error("Error with model {}: {}", modelName, e.getMessage());
            throw e; // Re-throw to try next model
        }
    }
}