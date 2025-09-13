package com.example.postfolio.rag.service;

import com.example.postfolio.rag.dto.QuestionRequest;
import com.example.postfolio.rag.dto.QuestionResponse;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RagService {

    private final WebClient webClient;
    private final Gson gson;
    
    // Store document chunks in memory (in production, use vector database)
    private final Map<String, List<String>> documentChunks = new ConcurrentHashMap<>();
    private final Map<String, String> documentTexts = new ConcurrentHashMap<>();
    
    private static final String GROQ_API_KEY = "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";
    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    
    public RagService() {
        this.webClient = WebClient.builder()
                .baseUrl(GROQ_API_URL)
                .build();
        this.gson = new Gson();
    }

    public String processDocument(MultipartFile file) throws IOException {
        // Clear previous documents when a new one is uploaded
        clearAllDocuments();
        
        String documentId = UUID.randomUUID().toString();
        
        // Extract text from PDF
        String extractedText = extractTextFromPdf(file);
        
        // Store full document text
        documentTexts.put(documentId, extractedText);
        
        // Split into chunks for better retrieval
        List<String> chunks = splitIntoChunks(extractedText, 1000);
        documentChunks.put(documentId, chunks);
        
        System.out.println("Document processed successfully. ID: " + documentId);
        System.out.println("Extracted text length: " + extractedText.length() + " characters");
        System.out.println("Number of chunks: " + chunks.size());
        
        return documentId;
    }
    
    private void clearAllDocuments() {
        documentTexts.clear();
        documentChunks.clear();
        System.out.println("Cleared all previous documents from memory");
    }
    
    public boolean hasDocuments() {
        return !documentTexts.isEmpty();
    }
    
    public int getDocumentCount() {
        return documentTexts.size();
    }

    public QuestionResponse answerQuestion(QuestionRequest request) {
        try {
            // For simplicity, using the latest uploaded document
            String documentId = getLatestDocumentId();
            if (documentId == null) {
                // If no document, try to answer the question directly with AI (for testing)
                System.out.println("No document found, answering question directly with AI");
                String directAnswer = generateAnswerWithGroq(request.getQuestion(), "No specific context provided. Please answer based on your general knowledge.");
                return new QuestionResponse(directAnswer, "No document context - general AI response");
            }

            // Retrieve relevant context
            String context = retrieveRelevantContext(documentId, request.getQuestion());
            
            // Generate answer using Groq API
            String answer = generateAnswerWithGroq(request.getQuestion(), context);
            
            return new QuestionResponse(answer, context);
            
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Error in answerQuestion: " + e.getMessage());
            return new QuestionResponse("Sorry, I encountered an error while processing your question: " + e.getMessage(), "");
        }
    }

    private String extractTextFromPdf(MultipartFile file) throws IOException {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private List<String> splitIntoChunks(String text, int chunkSize) {
        List<String> chunks = new ArrayList<>();
        String[] sentences = text.split("\\. ");
        
        StringBuilder currentChunk = new StringBuilder();
        
        for (String sentence : sentences) {
            if (currentChunk.length() + sentence.length() > chunkSize && currentChunk.length() > 0) {
                chunks.add(currentChunk.toString().trim());
                currentChunk = new StringBuilder();
            }
            currentChunk.append(sentence).append(". ");
        }
        
        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString().trim());
        }
        
        return chunks;
    }

    private String getLatestDocumentId() {
        return documentTexts.keySet().stream().findFirst().orElse(null);
    }

    private String retrieveRelevantContext(String documentId, String question) {
        List<String> chunks = documentChunks.get(documentId);
        if (chunks == null || chunks.isEmpty()) {
            return documentTexts.get(documentId);
        }

        // Simple keyword-based retrieval (in production, use semantic similarity)
        String[] questionWords = question.toLowerCase().split("\\s+");
        List<ChunkScore> scoredChunks = new ArrayList<>();

        for (String chunk : chunks) {
            int score = 0;
            String lowerChunk = chunk.toLowerCase();
            
            for (String word : questionWords) {
                if (word.length() > 3 && lowerChunk.contains(word)) {
                    score++;
                }
            }
            
            if (score > 0) {
                scoredChunks.add(new ChunkScore(chunk, score));
            }
        }

        // Sort by relevance and take top 3 chunks
        scoredChunks.sort((a, b) -> Integer.compare(b.score, a.score));
        
        StringBuilder context = new StringBuilder();
        int maxChunks = Math.min(3, scoredChunks.size());
        
        for (int i = 0; i < maxChunks; i++) {
            context.append(scoredChunks.get(i).chunk).append("\n\n");
        }
        
        return context.toString().trim();
    }

    private String generateAnswerWithGroq(String question, String context) {
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
                System.out.println("Trying model: " + modelName);
                return tryGroqRequest(question, context, modelName);
            } catch (Exception e) {
                System.err.println("Model " + modelName + " failed: " + e.getMessage());
                // Continue to next model
            }
        }
        
        return "I apologize, but I encountered an error while generating the answer. Please try again.";
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
            System.out.println("Trying Groq model: " + modelName);
            System.out.println("Groq API Request: " + gson.toJson(requestBody));

            // Make API call with error handling
            Mono<String> response = webClient.post()
                    .header("Authorization", "Bearer " + GROQ_API_KEY)
                    .header("Content-Type", "application/json")
                    .bodyValue(gson.toJson(requestBody))
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .doOnNext(errorBody -> System.err.println("Groq API Error Response: " + errorBody))
                                    .then(Mono.error(new RuntimeException("Groq API Error: " + clientResponse.statusCode()))))
                    .bodyToMono(String.class);

            String responseBody = response.block();
            System.out.println("Groq API Response: " + responseBody);
            
            // Parse response
            JsonObject responseJson = gson.fromJson(responseBody, JsonObject.class);
            String answer = responseJson.getAsJsonArray("choices")
                    .get(0).getAsJsonObject()
                    .getAsJsonObject("message")
                    .get("content").getAsString();
            
            System.out.println("Successfully used model: " + modelName);
            return answer;
                    
        } catch (Exception e) {
            System.err.println("Error with model " + modelName + ": " + e.getMessage());
            throw e; // Re-throw to try next model
        }
    }

    private static class ChunkScore {
        String chunk;
        int score;
        
        ChunkScore(String chunk, int score) {
            this.chunk = chunk;
            this.score = score;
        }
    }
}