package com.example.postfolio.rag.service;

import com.example.postfolio.rag.dto.QuestionRequest;
import com.example.postfolio.rag.dto.QuestionResponse;
import com.example.postfolio.rag.dto.GroqQueryRequest;
import com.example.postfolio.rag.dto.GroqQueryResponse;
import com.example.postfolio.util.JwtTokenHelper;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class RagService {

    private final WebClient.Builder webClientBuilder;
    private final JwtTokenHelper jwtTokenHelper;
    
    @Value("${ai-service.base-url}")
    private String aiServiceBaseUrl;
    
    // Store document chunks in memory per user (in production, use vector database)
    // Use nested maps: userId -> documentId -> chunks/data
    private final Map<String, Map<String, List<String>>> userDocumentChunks = new ConcurrentHashMap<>();
    private final Map<String, Map<String, String>> userDocumentTexts = new ConcurrentHashMap<>();
    // Store embeddings for semantic search per user
    private final Map<String, Map<String, List<double[]>>> userChunkEmbeddings = new ConcurrentHashMap<>();

    public String processDocument(String userId, MultipartFile file) throws IOException {
        // Clear previous documents for this user when a new one is uploaded
        clearUserDocuments(userId);
        
        String documentId = UUID.randomUUID().toString();
        
        // Extract text from PDF
        String extractedText = extractTextFromPdf(file);
        
        // Initialize user maps if they don't exist
        userDocumentTexts.computeIfAbsent(userId, k -> new ConcurrentHashMap<>());
        userDocumentChunks.computeIfAbsent(userId, k -> new ConcurrentHashMap<>());
        userChunkEmbeddings.computeIfAbsent(userId, k -> new ConcurrentHashMap<>());
        
        // Store full document text
        userDocumentTexts.get(userId).put(documentId, extractedText);
        
        // Split into chunks for better retrieval
        List<String> chunks = splitIntoChunks(extractedText, 1000);
        userDocumentChunks.get(userId).put(documentId, chunks);
        
        // Generate embeddings for each chunk
        List<double[]> embeddings = generateEmbeddingsForChunks(chunks);
        userChunkEmbeddings.get(userId).put(documentId, embeddings);
        
        log.info("Document processed successfully. ID: {}", documentId);
        log.info("Extracted text length: {} characters", extractedText.length());
        log.info("Number of chunks: {}", chunks.size());
        log.info("Generated embeddings for {} chunks", embeddings.size());
        
        return documentId;
    }
    
    private void clearUserDocuments(String userId) {
        Map<String, String> userTexts = userDocumentTexts.get(userId);
        Map<String, List<String>> userChunks = userDocumentChunks.get(userId);
        Map<String, List<double[]>> userEmbeddings = userChunkEmbeddings.get(userId);
        
        if (userTexts != null) userTexts.clear();
        if (userChunks != null) userChunks.clear();
        if (userEmbeddings != null) userEmbeddings.clear();
        
        log.info("Cleared all previous documents for user: {}", userId);
    }
    
    public boolean hasDocuments(String userId) {
        Map<String, String> userTexts = userDocumentTexts.get(userId);
        return userTexts != null && !userTexts.isEmpty();
    }
    
    public int getDocumentCount(String userId) {
        Map<String, String> userTexts = userDocumentTexts.get(userId);
        return userTexts != null ? userTexts.size() : 0;
    }

    public QuestionResponse answerQuestion(String userId, QuestionRequest request) {
        try {
            // For simplicity, using the latest uploaded document for this user
            String documentId = getLatestDocumentId(userId);
            if (documentId == null) {
                // If no document, try to answer the question directly with AI (for testing)
                log.info("No document found for user {}, answering question directly with AI", userId);
                String directAnswer = generateAnswerWithAI(request.getQuestion(), "No specific context provided. Please answer based on your general knowledge.");
                return new QuestionResponse(directAnswer, "No document context - general AI response");
            }

            // Retrieve relevant context
            String context = retrieveRelevantContext(userId, documentId, request.getQuestion());
            
            // Generate answer using AI service
            String answer = generateAnswerWithAI(request.getQuestion(), context);
            
            return new QuestionResponse(answer, context);
            
        } catch (Exception e) {
            e.printStackTrace();
            log.error("Error in answerQuestion: {}", e.getMessage(), e);
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

    private String getLatestDocumentId(String userId) {
        Map<String, String> userTexts = userDocumentTexts.get(userId);
        if (userTexts == null || userTexts.isEmpty()) {
            return null;
        }
        return userTexts.keySet().stream().findFirst().orElse(null);
    }

    private String retrieveRelevantContext(String userId, String documentId, String question) {
        Map<String, List<String>> userChunks = userDocumentChunks.get(userId);
        Map<String, List<double[]>> userEmbeddings = userChunkEmbeddings.get(userId);
        Map<String, String> userTexts = userDocumentTexts.get(userId);
        
        if (userChunks == null || userEmbeddings == null || userTexts == null) {
            return "No documents found for user";
        }
        
        List<String> chunks = userChunks.get(documentId);
        List<double[]> embeddings = userEmbeddings.get(documentId);
        
        if (chunks == null || chunks.isEmpty()) {
            return userTexts.get(documentId);
        }

        // Try semantic similarity if embeddings are available
        if (embeddings != null && !embeddings.isEmpty()) {
            return retrieveSemanticContext(chunks, embeddings, question);
        } else {
            // Fallback to keyword-based retrieval
            return retrieveKeywordContext(chunks, question);
        }
    }
    
    private String retrieveSemanticContext(List<String> chunks, List<double[]> embeddings, String question) {
        try {
            // Generate embedding for the question
            double[] questionEmbedding = generateEmbedding(question);
            
            if (questionEmbedding == null) {
                log.warn("Failed to generate question embedding, falling back to keyword search");
                return retrieveKeywordContext(chunks, question);
            }
            
            // Calculate cosine similarity for each chunk
            List<ChunkScore> scoredChunks = new ArrayList<>();
            
            for (int i = 0; i < chunks.size() && i < embeddings.size(); i++) {
                double similarity = cosineSimilarity(questionEmbedding, embeddings.get(i));
                scoredChunks.add(new ChunkScore(chunks.get(i), similarity));
            }
            
            // Sort by similarity and take top 3 chunks
            scoredChunks.sort((a, b) -> Double.compare(b.score, a.score));
            
            StringBuilder context = new StringBuilder();
            int maxChunks = Math.min(3, scoredChunks.size());
            
            log.debug("Top semantic matches:");
            for (int i = 0; i < maxChunks; i++) {
                ChunkScore chunk = scoredChunks.get(i);
                log.debug("  Chunk {} similarity: {}", i+1, String.format("%.4f", chunk.score));
                context.append(chunk.chunk).append("\n\n");
            }
            
            return context.toString().trim();
            
        } catch (Exception e) {
            log.error("Error in semantic retrieval: {}", e.getMessage());
            return retrieveKeywordContext(chunks, question);
        }
    }
    
    private String retrieveKeywordContext(List<String> chunks, String question) {
        // Simple keyword-based retrieval (fallback)
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
        scoredChunks.sort((a, b) -> Double.compare(b.score, a.score));
        
        StringBuilder context = new StringBuilder();
        int maxChunks = Math.min(3, scoredChunks.size());
        
        log.debug("Using keyword-based retrieval:");
        for (int i = 0; i < maxChunks; i++) {
            ChunkScore chunk = scoredChunks.get(i);
            log.debug("  Chunk {} keyword score: {}", i+1, chunk.score);
            context.append(chunk.chunk).append("\n\n");
        }
        
        return context.toString().trim();
    }

    private String generateAnswerWithAI(String question, String context) {
        try {
            log.info("Sending question to AI service: {}", question);

            // Create request payload for AI service
            GroqQueryRequest request = GroqQueryRequest.builder()
                    .question(question)
                    .context(context)
                    .build();

            // Create WebClient with JWT auth
            String authHeader = jwtTokenHelper.getAuthorizationHeader();
            WebClient.Builder builder = webClientBuilder.baseUrl(aiServiceBaseUrl);

            if (authHeader != null) {
                builder = builder.defaultHeader("Authorization", authHeader);
            }

            WebClient webClient = builder.build();

            // Call AI microservice
            Mono<GroqQueryResponse> responseMono = webClient.post()
                    .uri("/api/ai/groq-query")
                    .header("X-Service-Name", "rag-service")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(GroqQueryResponse.class);

            GroqQueryResponse response = responseMono.block();

            if (response == null) {
                throw new RuntimeException("AI service returned null response");
            }

            if (!response.isSuccess()) {
                throw new RuntimeException("AI service error: " + response.getError());
            }

            log.info("Successfully received answer from AI service using model: {}", response.getModel());
            return response.getAnswer();

        } catch (Exception e) {
            log.error("Error calling AI service for question answering: {}", e.getMessage(), e);
            return "I apologize, but I encountered an error while processing your question. Please try again.";
        }
    }
    
    private static class ChunkScore {
        String chunk;
        double score;
        
        ChunkScore(String chunk, double score) {
            this.chunk = chunk;
            this.score = score;
        }
        
        ChunkScore(String chunk, int score) {
            this.chunk = chunk;
            this.score = score;
        }
    }
    
    // Generate embeddings for a list of chunks
    private List<double[]> generateEmbeddingsForChunks(List<String> chunks) {
        List<double[]> embeddings = new ArrayList<>();
        
        for (String chunk : chunks) {
            try {
                double[] embedding = generateEmbedding(chunk);
                embeddings.add(embedding != null ? embedding : new double[1536]); // Fallback to zero vector
            } catch (Exception e) {
                log.error("Failed to generate embedding for chunk: {}", e.getMessage());
                embeddings.add(new double[1536]); // Add zero vector as fallback
            }
        }
        
        return embeddings;
    }
    
    // Generate embedding for a single text using a simple approach
    // In production, you would use a proper embedding model
    private double[] generateEmbedding(String text) {
        try {
            // Since Groq doesn't provide embeddings API, we'll use a simple hash-based approach
            // In production, you should use OpenAI embeddings API or a local embedding model
            return generateSimpleEmbedding(text);
        } catch (Exception e) {
            log.error("Failed to generate embedding: {}", e.getMessage());
            return new double[1536]; // Return zero vector on failure
        }
    }
    
    // Simple embedding generation based on text characteristics
    // This is a basic approach - in production use proper embedding models
    private double[] generateSimpleEmbedding(String text) {
        // Create a 384-dimensional vector (smaller for performance)
        int dimensions = 384;
        double[] embedding = new double[dimensions];
        
        // Normalize text
        String normalized = text.toLowerCase().replaceAll("[^a-z0-9\\s]", "");
        String[] words = normalized.split("\\s+");
        
        // Use word hashes and positions to create embedding
        for (int i = 0; i < words.length; i++) {
            String word = words[i];
            if (word.length() > 2) {
                int hash = Math.abs(word.hashCode());
                int position1 = hash % dimensions;
                int position2 = (hash / dimensions) % dimensions;
                int position3 = (hash / (dimensions * dimensions)) % dimensions;
                
                // Add word influence with position weighting
                double weight = 1.0 / (1.0 + i * 0.1); // Decrease weight for later words
                embedding[position1] += weight;
                embedding[position2] += weight * 0.5;
                embedding[position3] += weight * 0.25;
            }
        }
        
        // Add text length and structure features
        embedding[0] += text.length() / 1000.0; // Text length feature
        embedding[1] += words.length / 100.0;   // Word count feature
        
        // Normalize the vector
        double norm = 0.0;
        for (double value : embedding) {
            norm += value * value;
        }
        norm = Math.sqrt(norm);
        
        if (norm > 0) {
            for (int i = 0; i < embedding.length; i++) {
                embedding[i] /= norm;
            }
        }
        
        return embedding;
    }
    
    // Calculate cosine similarity between two vectors
    private double cosineSimilarity(double[] vectorA, double[] vectorB) {
        if (vectorA.length != vectorB.length) {
            throw new IllegalArgumentException("Vectors must have the same length");
        }
        
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        
        for (int i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += vectorA[i] * vectorA[i];
            normB += vectorB[i] * vectorB[i];
        }
        
        double denominator = Math.sqrt(normA) * Math.sqrt(normB);
        
        if (denominator == 0.0) {
            return 0.0; // Handle zero vectors
        }
        
        return dotProduct / denominator;
    }
}