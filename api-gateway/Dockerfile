FROM openjdk:21-jdk-slim

WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x ./mvnw && ./mvnw -B -q dependency:go-offline

COPY src ./src
RUN ./mvnw -B -q clean package -DskipTests \
 && echo "Built jar(s):" && ls -la target/*.jar

ENV SPRING_PROFILES_ACTIVE=docker
EXPOSE 8080
CMD ["sh","-c","java -jar target/*.jar"]
