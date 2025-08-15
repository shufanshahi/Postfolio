# Post Service

A microservice for managing posts in the Postfolio application.

## Features

- Create, read, update, and delete posts
- AI-powered post analysis and tagging using Gemini API
- Post reactions (celebrations)
- Profile-based post filtering
- Feed generation for connected users
- Skill-based post retrieval

## Technology Stack

- Spring Boot 3.5.3
- Spring Security
- Spring Data JPA
- PostgreSQL
- Google Gemini AI API
- Maven

## Configuration

The service runs on port 8082 and connects to the shared PostgreSQL database.

### Environment Variables

- `spring.datasource.url`: Database connection URL
- `spring.datasource.username`: Database username
- `spring.datasource.password`: Database password
- `jwt.secret`: JWT secret key (shared with other services)

## API Endpoints

### Posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/{postId}` - Get a specific post
- `PUT /api/posts/{postId}` - Update a post
- `DELETE /api/posts/{postId}` - Delete a post
- `GET /api/posts/latest` - Get latest posts

### Profile Posts
- `GET /api/posts/profile/{profileId}` - Get all posts for a profile
- `GET /api/posts/profile/{profileId}/paginated` - Get paginated posts for a profile
- `GET /api/posts/profile/{profileId}/type/{type}` - Get posts by type
- `GET /api/posts/profile/{profileId}/skills` - Get profile skills
- `GET /api/posts/profile/{profileId}/skills/{skill}` - Get posts by skill
- `GET /api/posts/profile/{profileId}/needs-review` - Get posts needing review

### Reactions
- `POST /api/posts/{postId}/celebrate` - Celebrate a post
- `GET /api/posts/{postId}/reactions` - Get post reactions

### Feed
- `GET /api/posts/feed` - Get feed posts for current user

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
- `post_tags` - Post tags (element collection) 