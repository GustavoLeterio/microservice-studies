#Build
FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app

#Install Maven
RUN apk add --no-cache maven

#Copy the source code from the current directory to the working directory
COPY . .

#-pl config-server : package the config-server module
#-am : and the dependencies of the config-server module
RUN mvn clean package -DskipTests -pl config-server -am

#Runtime
FROM eclipse-temurin:25-jre-alpine

#Install curl and bash
RUN apk add --no-cache curl bash

#Set the working directory to /app
WORKDIR /app

#Copy the built jar file from the build stage
COPY --from=build /app/config-server/target/*.jar app.jar

#Expose the port 8888
EXPOSE 8888

#Entrypoint to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]