# Use OpenJDK 21 as the base image
FROM openjdk:21-jdk-slim

# Set the working directory inside the container
WORKDIR /app

# Copy gradle wrapper and build files
COPY gradlew .
COPY gradle ./gradle
COPY build.gradle .
COPY settings.gradle .

# Make gradlew executable
RUN chmod +x ./gradlew

# Download dependencies (this layer will be cached)
RUN ./gradlew dependencies --no-daemon

# Copy the source code
COPY src ./src

# Build the application
RUN ./gradlew build -x test --no-daemon

# Expose the port
EXPOSE 9991

# Run the application
CMD ["java", "-jar", "build/libs/stripe-0.0.1-SNAPSHOT.jar"]