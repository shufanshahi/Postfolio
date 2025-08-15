# Job Service

A microservice for managing job postings and applications in the Postfolio application.

## Features

- Create, read, update, and delete job postings
- Job application management
- Employer-specific job listings
- Job status management (OPEN/CLOSED)
- Applicant tracking

## Technology Stack

- Spring Boot 3.5.3
- Spring Security
- Spring Data JPA
- PostgreSQL
- Maven

## Configuration

The service runs on port 8083 and connects to the shared PostgreSQL database.

### Environment Variables

- `spring.datasource.url`: Database connection URL
- `spring.datasource.username`: Database username
- `spring.datasource.password`: Database password
- `jwt.secret`: JWT secret key (shared with other services)

## API Endpoints

### Jobs
- `POST /api/jobs` - Create a new job posting
- `GET /api/jobs` - Get all job postings
- `GET /api/jobs/{jobId}` - Get a specific job
- `GET /api/jobs/employer/{employerId}` - Get jobs by employer
- `POST /api/jobs/{jobId}/apply/{applicantId}` - Apply for a job

### Health
- `GET /health` - Health check endpoint

## Running the Service

1. Ensure PostgreSQL is running
2. Build the project: `mvn clean install`
3. Run the service: `mvn spring-boot:run`

The service will be available at `http://localhost:8083`

## Database Schema

The service uses the same database as other microservices, sharing the following tables:
- `users` - User information
- `profiles` - User profiles
- `jobs` - Job postings
- `job_applicants` - Job applications (many-to-many)
- `job_selected_applicants` - Selected applicants (many-to-many) 