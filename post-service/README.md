# Post Service

A microservice for managing posts, CV generation, and CV entries in the Postfolio application.

## Features

- Create, read, update, and delete posts
- AI-powered post analysis and tagging using Google Gemini
- CV generation from posts and profile data
- CV entry management for in-app CV viewing
- Post reactions and celebrations
- Feed management
- Profile skills extraction

## Technology Stack

- Spring Boot 3.5.3
- Spring Security
- Spring Data JPA
- PostgreSQL
- Google Gemini AI API
- iText PDF (for CV generation)
- Maven

## Configuration

The service runs on port 8082 and connects to the shared PostgreSQL database.

### Environment Variables

- `spring.datasource.url`: Database connection URL
- `spring.datasource.username`: Database username
- `spring.datasource.password`: Database password
- `jwt.secret`: JWT secret key (shared with other services)
- `gemini.api.key`: Google Gemini API key (optional, falls back to mock service)

## API Endpoints

### Posts
- `POST /api/posts` - Create a new post
- `GET /api/posts` - Get all posts
- `GET /api/posts/{postId}` - Get a specific post
- `PUT /api/posts/{postId}` - Update a post
- `DELETE /api/posts/{postId}` - Delete a post
- `GET /api/posts/profile/{profileId}` - Get posts by profile
- `GET /api/posts/feed` - Get feed posts
- `POST /api/posts/{postId}/celebrate` - Celebrate a post

### CV Generation
- `GET /api/cv/generate/{profileId}` - Generate PDF CV for a profile

### CV Entries
- `GET /api/cv/entries/{profileId}` - Get CV entries for a profile
- `DELETE /api/cv/entries/post/{postId}` - Delete CV entries by post ID

### Health
- `GET /health` - Health check endpoint

## Running the Service

1. Ensure PostgreSQL is running
2. Build the project: `mvn clean install`
3. Run the service: `mvn spring-boot:run`

The service will be available at `http://localhost:8082`

## Database Schema

The service uses the same database as other microservices, sharing the following tables:
- `users` - User information
- `profiles` - User profiles
- `posts` - Post content and metadata
- `reactions` - Post reactions
- `cv_entries` - CV entries for in-app viewing

## AI Integration

The service integrates with Google Gemini AI for:
- Post type classification (EXPERIENCE, PROJECT, ACHIEVEMENT, SKILL)
- Automatic tag generation
- CV heading generation

If the Gemini API key is not configured, the service falls back to a mock AI service.

## CV Generation

The service can generate professional PDF CVs that include:
- Personal information from profile
- Education details
- Experience from posts
- Projects from posts
- Achievements from posts
- Skills extracted from post tags 