# Postfolio Backend Services Docker Deployment

This directory contains the Docker configuration for deploying all Postfolio backend services.

## Services Overview

- **Eureka Server** (Port 8761) - Service Discovery
- **API Gateway** (Port 8080) - API Gateway and Load Balancer
- **Main Backend** (Port 8082) - Core business logic
- **AI Service** (Port 8081) - AI processing and ML operations
- **Stripe Service** (Port 9991) - Payment processing
- **PostgreSQL** (Port 5432) - Primary database
- **Redis** (Port 6379) - Caching and session storage
- **RabbitMQ** (Port 5672, Management: 15672) - Message queue

## Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)
- At least 4GB RAM available for containers
- Ports 8080, 8081, 8082, 8761, 5432, 6379, 5672, 9991, 15672 available

## Quick Start

1. **Configure Environment Variables**
   ```bash
   cp .env .env.local
   # Edit .env.local with your actual API keys
   nano .env.local
   ```

2. **Deploy All Services**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Check Service Health**
   ```bash
   chmod +x health-check.sh
   ./health-check.sh
   ```

4. **Stop All Services**
   ```bash
   chmod +x stop-deploy.sh
   ./stop-deploy.sh
   ```

## Development Mode

For local development, you can run only the infrastructure services:

```bash
chmod +x dev-mode.sh
./dev-mode.sh
```

This starts only PostgreSQL, Redis, and RabbitMQ, allowing you to run Spring Boot applications locally in your IDE.

## Configuration Files

### Environment Variables (.env)

Required environment variables:
- `GEMINI_API_KEY` - Your Gemini AI API key
- `NEWS_API_KEY` - Your News API key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PUBLIC_KEY` - Your Stripe public key
- Database and other service credentials

### Service-Specific Configuration

Each service has Docker-specific configuration files:
- `*/src/main/resources/application-docker.yml` or `application-docker.properties`

## Deployment Scripts

- `deploy.sh` - Build and deploy all services
- `stop-deploy.sh` - Stop all services
- `dev-mode.sh` - Start only infrastructure services
- `health-check.sh` - Check service health status

## Service URLs

After deployment, services will be available at:

- **Eureka Dashboard**: http://localhost:8761
- **API Gateway**: http://localhost:8080
- **Main Backend**: http://localhost:8082
- **AI Service**: http://localhost:8081
- **Stripe Service**: http://localhost:9991
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

## Docker Commands

### View Running Services
```bash
docker-compose ps
```

### View Service Logs
```bash
docker-compose logs -f [service-name]
# Example: docker-compose logs -f postfolio-backend
```

### Restart a Service
```bash
docker-compose restart [service-name]
```

### Rebuild a Service
```bash
docker-compose up -d --build [service-name]
```

### Scale a Service
```bash
docker-compose up -d --scale postfolio-backend=2
```

## Troubleshooting

### Services Not Starting
1. Check if required ports are available
2. Verify environment variables in `.env`
3. Check service logs: `docker-compose logs [service-name]`

### Database Connection Issues
1. Ensure PostgreSQL container is running: `docker-compose ps postgres`
2. Check database logs: `docker-compose logs postgres`
3. Verify database credentials in `.env`

### Service Discovery Issues
1. Check Eureka server: http://localhost:8761
2. Verify all services are registered
3. Check network connectivity between containers

### Memory Issues
1. Increase Docker memory limit (Docker Desktop)
2. Monitor resource usage: `docker stats`

## Production Deployment

For production deployment:

1. **Security**
   - Change all default passwords
   - Use secrets management
   - Enable SSL/TLS
   - Configure firewall rules

2. **Monitoring**
   - Add monitoring services (Prometheus, Grafana)
   - Configure log aggregation
   - Set up alerting

3. **Backup**
   - Configure database backups
   - Set up volume backups

4. **Scaling**
   - Use Docker Swarm or Kubernetes
   - Configure load balancing
   - Set up horizontal pod autoscaling

## Network Configuration

All services run on a custom bridge network `postfolio-network` for secure inter-service communication.

## Volume Management

Persistent volumes:
- `postgres_data` - PostgreSQL data
- `redis_data` - Redis data
- `rabbitmq_data` - RabbitMQ data
- `interview_audio` - Audio files storage

To remove all data:
```bash
./stop-deploy.sh --remove-volumes
```