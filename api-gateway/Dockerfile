#Explanation on Config Server's Dockerfile
FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app

RUN apk add --no-cache maven

COPY . .
RUN mvn clean package -DskipTests -pl api-gateway -am

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

RUN apk add --no-cache curl bash

COPY --from=build /app/api-gateway/target/*.jar app.jar

EXPOSE 8222
ENTRYPOINT ["java", "-jar", "app.jar"]