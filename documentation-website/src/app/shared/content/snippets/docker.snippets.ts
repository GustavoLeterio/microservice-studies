// Dockerfiles, docker-compose.yml e .dockerignore reais do projeto.

export const CONFIG_SERVER_DOCKERFILE = `
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
`;

export const CUSTOMER_DOCKERFILE = `
#Explanation on Config Server's Dockerfile
FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app

RUN apk add --no-cache maven

COPY . .
RUN mvn clean package -DskipTests -pl microservices/customer-microservice -am

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

RUN apk add --no-cache curl bash

COPY --from=build /app/microservices/customer-microservice/target/*.jar app.jar

EXPOSE 8091
ENTRYPOINT ["java", "-jar", "app.jar"]
`;

const moduleDockerfile = (module: string, port: number): string => `
#Explanation on Config Server's Dockerfile
FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app

RUN apk add --no-cache maven

COPY . .
RUN mvn clean package -DskipTests -pl ${module} -am

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

RUN apk add --no-cache curl bash

COPY --from=build /app/${module}/target/*.jar app.jar

EXPOSE ${port}
ENTRYPOINT ["java", "-jar", "app.jar"]
`;

export const API_GATEWAY_DOCKERFILE = moduleDockerfile('api-gateway', 8222);
export const DISCOVERY_DOCKERFILE = moduleDockerfile('discovery-server', 8761);
export const PRODUCT_DOCKERFILE = moduleDockerfile('microservices/product-microservice', 8092);
export const CART_DOCKERFILE = moduleDockerfile('microservices/cart-microservice', 8093);

export const DOCKERFILE_BUILD_STAGE = `
FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app
RUN apk add --no-cache maven
COPY . .
RUN mvn clean package -DskipTests -pl microservices/cart-microservice -am
`;

export const DOCKERFILE_RUNTIME_STAGE = `
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl bash
COPY --from=build /app/microservices/cart-microservice/target/*.jar app.jar
EXPOSE 8093
ENTRYPOINT ["java", "-jar", "app.jar"]
`;

export const DOCKERFILE_CACHE_SUGGESTION = `
FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app
RUN apk add --no-cache maven

# 1) Copia só os POMs e baixa as dependências (camada reaproveitada enquanto os POMs não mudarem)
COPY pom.xml .
COPY microservices/pom.xml microservices/
COPY microservices/common-exceptions/pom.xml microservices/common-exceptions/
COPY microservices/cart-microservice/pom.xml microservices/cart-microservice/
RUN mvn -q -pl microservices/cart-microservice -am dependency:go-offline

# 2) Só depois copia o código-fonte
COPY microservices/common-exceptions/src microservices/common-exceptions/src
COPY microservices/cart-microservice/src microservices/cart-microservice/src
RUN mvn clean package -DskipTests -pl microservices/cart-microservice -am
`;

export const DOCKER_COMPOSE = `
services:
  mongodb:
    image: mongo
    container_name: mongo_db
    ports:
      - "\${MONGO_DB_PORT}:27017"
    volumes:
      - mongo:/data/db
    restart: always
    environment:
      - MONGO_INITDB_ROOT_USERNAME=\${MONGO_DB_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=\${MONGO_DB_PASSWORD}
    networks:
      - microservices
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 3s
      retries: 5

  postgres:
    container_name: postgresql_db
    image: postgres
    restart: always
    environment:
      - POSTGRES_USER=\${POSTGRES_USER}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - POSTGRES_DB=\${PRODUCT_DB_NAME}
    volumes:
      - postgres:/var/lib/postgresql
    ports:
      - "\${POSTGRES_PORT}:5432"
    networks:
      - microservices
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $\${POSTGRES_USER} -d $\${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s

  api-gateway:
    build:
      context: .
      dockerfile: ./api-gateway/Dockerfile
    container_name: api-gateway
    depends_on:
      config-server:
        condition: service_healthy
      discovery-server:
        condition: service_healthy
    ports:
      - "\${GATEWAY_SERVER_PORT}:8222"
    environment:
      - SPRING_CONFIG_IMPORT=configserver:http://config-server:\${CONFIG_SERVER_PORT}
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://discovery-server:\${DISCOVERY_SERVER_PORT}/eureka/
    networks:
      - microservices

  config-server:
    build:
      context: .
      dockerfile: ./config-server/Dockerfile
    container_name: config-server
    ports:
      - "\${CONFIG_SERVER_PORT}:8888"
    networks:
      - microservices
    healthcheck:
      test:
        [
          "CMD",
          "curl",
          "-f",
          "http://config-server:\${CONFIG_SERVER_PORT}/actuator/health",
        ]
      interval: 30s
      timeout: 3s
      retries: 5
    restart: on-failure

  discovery-server:
    build:
      context: .
      dockerfile: ./discovery-server/Dockerfile
    container_name: discovery-server
    depends_on:
      config-server:
        condition: service_healthy
    ports:
      - "\${DISCOVERY_SERVER_PORT}:8761"
    environment:
      - SPRING_CONFIG_IMPORT=configserver:http://config-server:\${CONFIG_SERVER_PORT}
    networks:
      - microservices
    healthcheck:
      test:
        [
          "CMD",
          "curl",
          "-f",
          "http://discovery-server:\${DISCOVERY_SERVER_PORT}/actuator/health",
        ]
      interval: 30s
      timeout: 3s
      retries: 5
    restart: on-failure

  customer-microservice:
    build:
      context: .
      dockerfile: ./microservices/customer-microservice/Dockerfile
    container_name: customer-microservice
    depends_on:
      mongodb:
        condition: service_healthy
      config-server:
        condition: service_healthy
      discovery-server:
        condition: service_healthy
    ports:
      - "\${CUSTOMER_MICROSERVICE_PORT}:8091"
    environment:
      - SPRING_CONFIG_IMPORT=configserver:http://config-server:\${CONFIG_SERVER_PORT}
      - EUREKA_DEFAULT_ZONE=http://discovery-server:\${DISCOVERY_SERVER_PORT}/eureka
      - SPRING_MONGODB_URI=mongodb://\${MONGO_DB_USERNAME}:\${MONGO_DB_PASSWORD}@mongodb:\${MONGO_DB_PORT}/\${CUSTOMER_DB_NAME}?authSource=admin
    networks:
      - microservices
    volumes:
      - ./microservices/customer-microservice/logs:/app/logs

  product-microservice:
    build:
      context: .
      dockerfile: ./microservices/product-microservice/Dockerfile
    depends_on:
      postgres:
        condition: service_healthy
      config-server:
        condition: service_healthy
      discovery-server:
        condition: service_healthy
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:\${POSTGRES_PORT}/\${PRODUCT_DB_NAME}
      - SPRING_DATASOURCE_USERNAME=\${POSTGRES_USER}
      - SPRING_DATASOURCE_PASSWORD=\${POSTGRES_PASSWORD}
      - SPRING_CONFIG_IMPORT=configserver:http://config-server:\${CONFIG_SERVER_PORT}
      - EUREKA_DEFAULT_ZONE=http://discovery-server:\${DISCOVERY_SERVER_PORT}/eureka
    networks:
      - microservices
    volumes:
      - ./microservices/product-microservice/logs:/app/logs

  cart-microservice:
    build:
      context: .
      dockerfile: ./microservices/cart-microservice/Dockerfile
    depends_on:
      mongodb:
        condition: service_healthy
      config-server:
        condition: service_healthy
      discovery-server:
        condition: service_healthy
    volumes:
      - ./microservices/cart-microservice/logs:/app/logs
    environment:
      - SPRING_CONFIG_IMPORT=configserver:http://config-server:\${CONFIG_SERVER_PORT}
      - EUREKA_DEFAULT_ZONE=http://discovery-server:\${DISCOVERY_SERVER_PORT}/eureka
      - SPRING_MONGODB_URI=mongodb://\${MONGO_DB_USERNAME}:\${MONGO_DB_PASSWORD}@mongodb:\${MONGO_DB_PORT}/\${CART_DB_NAME}?authSource=admin
    networks:
      - microservices

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "\${PROMETHEUS_PORT}:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - microservices

  grafana:
    image: grafana/grafana:latest
    ports:
      - "\${GRAFANA_PORT}:3000"
    volumes:
      - ./grafana.data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_USER=\${GRAFANA_ADMIN_USER}
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_ADMIN_PASSWORD}
    depends_on:
      - prometheus
    networks:
      - microservices

volumes:
  mongo:
  postgres:
  grafana-data:

networks:
  microservices:
    driver: bridge

  config-server:
`;

export const COMPOSE_DATABASES = `
  mongodb:
    image: mongo
    container_name: mongo_db
    ports:
      - "\${MONGO_DB_PORT}:27017"
    volumes:
      - mongo:/data/db
    restart: always
    environment:
      - MONGO_INITDB_ROOT_USERNAME=\${MONGO_DB_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=\${MONGO_DB_PASSWORD}
    networks:
      - microservices
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 3s
      retries: 5

  postgres:
    container_name: postgresql_db
    image: postgres
    restart: always
    environment:
      - POSTGRES_USER=\${POSTGRES_USER}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - POSTGRES_DB=\${PRODUCT_DB_NAME}
    volumes:
      - postgres:/var/lib/postgresql
    ports:
      - "\${POSTGRES_PORT}:5432"
    networks:
      - microservices
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $\${POSTGRES_USER} -d $\${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
`;

export const COMPOSE_CUSTOMER = `
  customer-microservice:
    build:
      context: .
      dockerfile: ./microservices/customer-microservice/Dockerfile
    container_name: customer-microservice
    depends_on:
      mongodb:
        condition: service_healthy
      config-server:
        condition: service_healthy
      discovery-server:
        condition: service_healthy
    ports:
      - "\${CUSTOMER_MICROSERVICE_PORT}:8091"
    environment:
      - SPRING_CONFIG_IMPORT=configserver:http://config-server:\${CONFIG_SERVER_PORT}
      - EUREKA_DEFAULT_ZONE=http://discovery-server:\${DISCOVERY_SERVER_PORT}/eureka
      - SPRING_MONGODB_URI=mongodb://\${MONGO_DB_USERNAME}:\${MONGO_DB_PASSWORD}@mongodb:\${MONGO_DB_PORT}/\${CUSTOMER_DB_NAME}?authSource=admin
    networks:
      - microservices
    volumes:
      - ./microservices/customer-microservice/logs:/app/logs
`;

export const COMPOSE_PRODUCT = `
  product-microservice:
    build:
      context: .
      dockerfile: ./microservices/product-microservice/Dockerfile
    depends_on:
      postgres:
        condition: service_healthy
      config-server:
        condition: service_healthy
      discovery-server:
        condition: service_healthy
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:\${POSTGRES_PORT}/\${PRODUCT_DB_NAME}
      - SPRING_DATASOURCE_USERNAME=\${POSTGRES_USER}
      - SPRING_DATASOURCE_PASSWORD=\${POSTGRES_PASSWORD}
      - SPRING_CONFIG_IMPORT=configserver:http://config-server:\${CONFIG_SERVER_PORT}
      - EUREKA_DEFAULT_ZONE=http://discovery-server:\${DISCOVERY_SERVER_PORT}/eureka
    networks:
      - microservices
    volumes:
      - ./microservices/product-microservice/logs:/app/logs
`;

export const COMPOSE_CART = `
  cart-microservice:
    build:
      context: .
      dockerfile: ./microservices/cart-microservice/Dockerfile
    depends_on:
      mongodb:
        condition: service_healthy
      config-server:
        condition: service_healthy
      discovery-server:
        condition: service_healthy
    volumes:
      - ./microservices/cart-microservice/logs:/app/logs
    environment:
      - SPRING_CONFIG_IMPORT=configserver:http://config-server:\${CONFIG_SERVER_PORT}
      - EUREKA_DEFAULT_ZONE=http://discovery-server:\${DISCOVERY_SERVER_PORT}/eureka
      - SPRING_MONGODB_URI=mongodb://\${MONGO_DB_USERNAME}:\${MONGO_DB_PASSWORD}@mongodb:\${MONGO_DB_PORT}/\${CART_DB_NAME}?authSource=admin
    networks:
      - microservices
`;

export const COMPOSE_API_GATEWAY = `
  api-gateway:
    build:
      context: .
      dockerfile: ./api-gateway/Dockerfile
    container_name: api-gateway
    depends_on:
      config-server:
        condition: service_healthy
      discovery-server:
        condition: service_healthy
    ports:
      - "\${GATEWAY_SERVER_PORT}:8222"
    environment:
      - SPRING_CONFIG_IMPORT=configserver:http://config-server:\${CONFIG_SERVER_PORT}
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://discovery-server:\${DISCOVERY_SERVER_PORT}/eureka/
    networks:
      - microservices
`;

export const COMPOSE_CONFIG_SERVER = `
  config-server:
    build:
      context: .
      dockerfile: ./config-server/Dockerfile
    container_name: config-server
    ports:
      - "\${CONFIG_SERVER_PORT}:8888"
    networks:
      - microservices
    healthcheck:
      test:
        [
          "CMD",
          "curl",
          "-f",
          "http://config-server:\${CONFIG_SERVER_PORT}/actuator/health",
        ]
      interval: 30s
      timeout: 3s
      retries: 5
    restart: on-failure
`;

export const COMPOSE_DISCOVERY_SERVER = `
  discovery-server:
    build:
      context: .
      dockerfile: ./discovery-server/Dockerfile
    container_name: discovery-server
    depends_on:
      config-server:
        condition: service_healthy
    ports:
      - "\${DISCOVERY_SERVER_PORT}:8761"
    environment:
      - SPRING_CONFIG_IMPORT=configserver:http://config-server:\${CONFIG_SERVER_PORT}
    networks:
      - microservices
    healthcheck:
      test:
        [
          "CMD",
          "curl",
          "-f",
          "http://discovery-server:\${DISCOVERY_SERVER_PORT}/actuator/health",
        ]
      interval: 30s
      timeout: 3s
      retries: 5
    restart: on-failure
`;

export const COMPOSE_OBSERVABILITY = `
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "\${PROMETHEUS_PORT}:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - microservices

  grafana:
    image: grafana/grafana:latest
    ports:
      - "\${GRAFANA_PORT}:3000"
    volumes:
      - ./grafana.data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_USER=\${GRAFANA_ADMIN_USER}
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_ADMIN_PASSWORD}
    depends_on:
      - prometheus
    networks:
      - microservices
`;

export const COMPOSE_VOLUMES_NETWORKS = `
volumes:
  mongo:
  postgres:
  grafana-data:

networks:
  microservices:
    driver: bridge

  config-server:
`;

export const DOCKERIGNORE = `
**/target/
**/.git/
**/.idea/
**/.vscode/
.mvn/
**/mvnw
**/mvnw.cmd

.idea/
.vscode/
*.iml
*.swp

*.log
tmp/

.git
.gitignore

Dockerfile
docker-compose.yml
.dockerignore

.env

# Site de documentação (Angular): não participa do build das imagens Java
documentation-website/
`;
