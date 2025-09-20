# 🚀 Postfolio

**A comprehensive professional social media platform designed for career growth and networking**

Postfolio combines social sharing, portfolio generation, job searching, and interview preparation in one unified ecosystem, empowering professionals to showcase achievements and connect with industry leaders.

## 🌟 Key Features

### 📱 **Professional Social Media**
- **Social Feed**: Share career achievements, insights, and professional updates
- **Professional Networking**: Connect with industry professionals and thought leaders
- **Real-time Messaging**: Engage with your network through integrated chat
- **Interactive Posts**: Like, comment, and engage with professional content

### 💼 **Intelligent Job Marketplace**
- **Smart Job Matching**: AI-powered job recommendations based on skills and experience
- **Advanced Search & Filters**: Find opportunities by location, skills, salary, and more
- **Application Tracking**: Monitor application status and employer responses
- **Employer Dashboard**: Post jobs, manage applicants, and schedule interviews

### 🎯 **AI-Powered Interview Preparation**
- **Mock Interviews**: Practice with AI-generated, role-specific interview questions
- **Custom Interview Generation**: Tailored questions based on job descriptions
- **Real-time Audio Feedback**: Voice-enabled practice sessions with TTS integration
- **Interview Evaluation**: AI analysis of responses with improvement suggestions
- **Performance Analytics**: Track progress and identify areas for improvement

### 📄 **Dynamic Portfolio & CV Generation**
- **Auto-Generated CVs**: Create professional resumes from your profile data
- **Portfolio Showcase**: Display projects, achievements, and work samples
- **Skill Validation**: Verify and endorse professional skills
- **Experience Timeline**: Visual representation of career progression

### 🗺️ **Personalized Career Roadmaps**
- **Interview Preparation Plans**: Step-by-step preparation based on interview dates
- **Skill Development Paths**: Curated learning resources and timelines
- **Goal Tracking**: Monitor progress towards career objectives
- **Resource Recommendations**: Relevant courses, tutorials, and practice materials

### 💰 **Integrated Payment System**
- **Premium Features**: Stripe-powered subscription management
- **Secure Transactions**: PCI-compliant payment processing
- **Flexible Plans**: Various subscription tiers for different user needs

### 🤝 **Mentorship Program**
- **Mentor Matching**: Connect with experienced professionals
- **Video Calls**: Integrated video calling for mentorship sessions
- **Guidance Tracking**: Track mentorship progress and goals

## 🏗️ Architecture

Postfolio is built on a modern microservices architecture ensuring scalability, reliability, and maintainability:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │ Eureka Server   │
│   (Next.js)     │◄──►│  (Spring Boot)  │◄──►│ (Service Disc.) │
│   Port: 3000    │    │   Port: 8080    │    │   Port: 8761    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │ Main Service │ │ AI Service  │ │   Stripe   │
        │ (Spring Boot)│ │(Spring Boot)│ │ (Payment)  │
        │ Port: 8082   │ │ Port: 8081  │ │Port: 9991  │
        └──────────────┘ └─────────────┘ └────────────┘
                │               │
        ┌───────▼──────┐ ┌──────▼──────┐
        │ PostgreSQL   │ │  RabbitMQ   │
        │ Database     │ │Message Queue│
        │ Port: 5433   │ │ Port: 5672  │
        └──────────────┘ └─────────────┘
                │
        ┌───────▼──────┐
        │    Redis     │
        │    Cache     │
        │ Port: 6379   │
        └──────────────┘
```

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: React Context API
- **Real-time**: Socket.IO client
- **Maps**: Leaflet & React-Leaflet
- **Charts**: Recharts
- **Payments**: Stripe React components

### **Backend**
- **Framework**: Spring Boot 3.x with Java
- **Architecture**: Microservices with Spring Cloud
- **API Gateway**: Spring Cloud Gateway
- **Service Discovery**: Netflix Eureka
- **Security**: JWT-based authentication
- **Documentation**: OpenAPI/Swagger

### **Database & Storage**
- **Primary Database**: PostgreSQL 15
- **Caching**: Redis 7
- **Message Queue**: RabbitMQ 3
- **File Storage**: Local file system with audio support

### **AI & External Services**
- **AI Provider**: Google Gemini API
- **Text-to-Speech**: Integrated TTS for interview audio
- **News Integration**: News API for industry updates
- **Payment Processing**: Stripe
- **Communication**: Real-time messaging and video calls

### **DevOps & Deployment**
- **Containerization**: Docker & Docker Compose
- **Build Tools**: Maven (Java), npm (Node.js), Gradle (Stripe service)
- **Environment Management**: Multi-profile configuration (dev, docker, production)

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (if running locally)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Postfolio
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

   Required environment variables:
   ```env
   # Database
   POSTGRES_DB=postfolio
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=admin
   
   # AI Services
   GEMINI_API_KEY=your_gemini_api_key
   
   # External APIs
   NEWS_API_KEY=your_news_api_key
   
   # Payment
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLIC_KEY=your_stripe_public_key
   STRIPE_RETURN_URL=http://localhost:3000
   
   # Message Queue
   RABBITMQ_USER=guest
   RABBITMQ_PASSWORD=guest
   ```

### Running with Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Setup

1. **Start Infrastructure Services**
   ```bash
   # Start PostgreSQL, Redis, and RabbitMQ
   docker-compose up -d postgres redis rabbitmq
   ```

2. **Backend Services**
   ```bash
   # Eureka Server
   cd eureka-server
   ./mvnw spring-boot:run

   # Main Backend Service
   cd server
   ./mvnw spring-boot:run

   # AI Service
   cd ai-service
   ./mvnw spring-boot:run

   # API Gateway
   cd api-gateway
   ./mvnw spring-boot:run

   # Stripe Service
   cd stripe
   ./gradlew bootRun
   ```

3. **Frontend**
   ```bash
   cd client
   npm install
   npm run dev
   ```

### Access URLs

- **Frontend Application**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Eureka Dashboard**: http://localhost:8761
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

## 📚 API Documentation

Once the services are running, access the API documentation:

- **Main API**: http://localhost:8080/swagger-ui.html
- **AI Service**: http://localhost:8081/swagger-ui.html
- **Stripe Service**: http://localhost:9991/swagger-ui.html

## 🔧 Development

### Project Structure
```
Postfolio/
├── client/                 # Next.js frontend application
├── server/                 # Main Spring Boot backend service
├── ai-service/            # AI processing microservice
├── api-gateway/           # Spring Cloud Gateway
├── eureka-server/         # Service discovery server
├── stripe/                # Payment processing service
├── docker-compose.yml     # Docker composition for all services
└── README.md             # This file
```

### Key Development Commands

```bash
# Frontend development
cd client && npm run dev

# Backend development with hot reload
cd server && ./mvnw spring-boot:run

# Build all services
docker-compose build

# Run tests
cd server && ./mvnw test
cd ai-service && ./mvnw test
```

## 🧪 Testing

### Backend Testing
```bash
# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=JobServiceTest

# Generate test reports
./mvnw surefire-report:report
```

### API Testing
Use the provided Swagger documentation or tools like Postman to test the REST endpoints.

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for users and employers
- **Input Validation**: Comprehensive validation on all endpoints
- **CORS Configuration**: Properly configured cross-origin requests
- **Secure Headers**: Security headers for XSS and CSRF protection

## 📈 Performance & Scalability

- **Microservices Architecture**: Independent scaling of services
- **Redis Caching**: Improved response times for frequently accessed data
- **Async Processing**: RabbitMQ for background job processing
- **Database Optimization**: Proper indexing and query optimization
- **Connection Pooling**: Efficient database connection management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation for endpoint details
- Review the docker-compose logs for troubleshooting

## 🙏 Acknowledgments

- **Spring Boot Team** for the excellent framework
- **Next.js Team** for the powerful React framework
- **Google** for the Gemini AI API
- **Stripe** for payment processing capabilities
- **All contributors** who helped build this platform

---

**Built with ❤️ for the professional community**

*Empowering careers through technology*