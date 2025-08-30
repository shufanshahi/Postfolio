# Postfolio AI Service

This microservice handles all AI-related processing for the Postfolio application, including post analysis, job matching, MCQ generation, and interview question generation.

## Features

- **Post Processing**: Analyzes posts to generate CV headings and auto-tags
- **Job Matching**: Intelligent matching between job requirements and candidate profiles
- **MCQ Generation**: Creates multiple choice questions from documents
- **Interview Generation**: Generates interview questions based on job roles
- **Async Processing**: All operations support both synchronous and asynchronous processing
- **Circuit Breaker**: Resilient AI API calls with fallback mechanisms
- **Caching**: Redis-based caching for improved performance

## Architecture

```
┌─────────────────┐    RabbitMQ     ┌─────────────────┐
│   Main App      │ ◄──────────────► │   AI Service    │
│   (Port 8080)   │                 │   (Port 8081)   │
└─────────────────┘                 └─────────────────┘
        │                                     │
        ▼                                     ▼
┌─────────────────┐                 ┌─────────────────┐
│   PostgreSQL    │                 │   Gemini API    │
│   Database      │                 │   (Google AI)   │
└─────────────────┘                 └─────────────────┘
        │
        ▼
┌─────────────────┐
│   Redis Cache   │
└─────────────────┘
```

## API Endpoints

### Post Processing
- `POST /api/ai/process-post` - Synchronous post processing
- `POST /api/ai/process-post-async` - Asynchronous post processing

### Job Matching
- `POST /api/ai/match-job` - Synchronous job matching
- `POST /api/ai/match-job-async` - Asynchronous job matching

### MCQ Generation
- `POST /api/ai/generate-mcq` - Synchronous MCQ generation
- `POST /api/ai/generate-mcq-async` - Asynchronous MCQ generation

### Interview Generation
- `POST /api/ai/generate-interview` - Synchronous interview generation
- `POST /api/ai/generate-interview-async` - Asynchronous interview generation

### Health Check
- `GET /api/ai/health` - Service health status

## Configuration

### Environment Variables
```bash
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/postfolio
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=password

# Redis
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379

# RabbitMQ
SPRING_RABBITMQ_HOST=localhost
SPRING_RABBITMQ_PORT=5672
SPRING_RABBITMQ_USERNAME=admin
SPRING_RABBITMQ_PASSWORD=admin123

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

## Running the Service

### Using Docker Compose (Recommended)
```bash
# From the project root
docker-compose up ai-service
```

### Using Maven
```bash
cd ai-service
./mvnw spring-boot:run
```

### Using Docker
```bash
cd ai-service
docker build -t ai-service .
docker run -p 8081:8081 ai-service
```

## Message Queue Integration

The service listens to the following RabbitMQ queues:
- `ai.post.processing` - Post processing requests
- `ai.job.matching` - Job matching requests
- `ai.mcq.generation` - MCQ generation requests
- `ai.interview.generation` - Interview generation requests

Results are published to:
- `ai.post.result` - Post processing results
- `ai.job.result` - Job matching results
- `ai.mcq.result` - MCQ generation results
- `ai.interview.result` - Interview generation results

## Error Handling

- **Circuit Breaker**: Automatically handles Gemini API failures
- **Fallback Responses**: Provides reasonable defaults when AI processing fails
- **Dead Letter Queue**: Failed messages are routed to `ai.dlq` for manual review
- **Retry Logic**: Automatic retry for transient failures

## Monitoring

- **Health Endpoint**: `/actuator/health`
- **Metrics**: `/actuator/metrics`
- **Prometheus**: `/actuator/prometheus`

## Performance

- **Async Processing**: Non-blocking operations using `@Async`
- **Connection Pooling**: Optimized database connections
- **Redis Caching**: Caches frequently accessed data
- **Circuit Breaker**: Prevents cascade failures

## Dependencies

- Spring Boot 3.5.5
- Spring AMQP (RabbitMQ)
- Spring Data Redis
- Resilience4j (Circuit Breaker)
- Google Gson (JSON processing)
- Lombok (Code generation)

## Development

### Prerequisites
- Java 17+
- Maven 3.6+
- PostgreSQL 13+
- Redis 7+
- RabbitMQ 3.x
- Gemini API Key

### Building
```bash
./mvnw clean package
```

### Testing
```bash
./mvnw test
```

## Troubleshooting

### Common Issues
1. **Gemini API Rate Limits**: Implement backoff strategies
2. **Memory Issues**: Tune JVM heap size for large document processing
3. **Queue Backlog**: Monitor RabbitMQ queue depths
4. **Database Connections**: Check connection pool settings

### Logs
```bash
# View logs
docker logs postfolio-ai-service

# Follow logs
docker logs -f postfolio-ai-service
```
