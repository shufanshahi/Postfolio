FROM openjdk:21-jdk-slim

WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x ./mvnw && ./mvnw -B -q dependency:go-offline

COPY src ./src
RUN ./mvnw -B -q clean package -DskipTests

EXPOSE 8761
CMD ["sh","-c","java -jar target/*.jar --spring.profiles.active=docker"]
