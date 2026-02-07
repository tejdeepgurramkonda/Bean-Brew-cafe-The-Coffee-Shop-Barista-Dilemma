# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create a non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the application port
EXPOSE 8082

# Set environment variables (can be overridden at runtime)
ENV SPRING_DATASOURCE_URL=jdbc:sqlserver://host.docker.internal:1433;databaseName=BaristaDatabase;encrypt=true;trustServerCertificate=true
ENV SPRING_DATASOURCE_USERNAME=Tejdeep
ENV SPRING_DATASOURCE_PASSWORD=Tejdeep@100

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
