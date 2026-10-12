// Arquivos de configuração reais: Config Server, application.yml locais, .env, prometheus.yml.

export const CONFIG_SERVER_APPLICATION_YML = `
spring:
    application:
        name: config-server
    profiles:
        active: native
    cloud:
        config:
            server:
                native:
                    search-locations: classpath:/config
server:
    port: 8888

management:
    endpoints:
        web:
            exposure:
                include: health, info, prometheus
    endpoint:
        health:
            show-details: always
`;

export const API_GATEWAY_CONFIG_YML = `
spring:
  cloud:
    gateway:
      server:
        webflux:
          routes:
            - id: customer-microservice
              uri: lb://customer-microservice
              predicates:
                - Path=/api/v1/customers/**,/v3/api-docs/customers
              filters:
                - PreserveHostHeader
                - RewritePath=/v3/api-docs/customers, /v3/api-docs
            - id: product-microservice
              uri: lb://product-microservice
              predicates:
                - Path=/api/v1/products/**,/api/v1/categories/**,/v3/api-docs/products
              filters:
                - PreserveHostHeader
                - RewritePath=/v3/api-docs/products, /v3/api-docs
            - id: cart-microservice
              uri: lb://cart-microservice
              predicates:
                - Path=/api/v1/carts/**,/v3/api-docs/cart
              filters:
                - PreserveHostHeader
                - RewritePath=/v3/api-docs/cart, /v3/api-docs

springdoc:
  swagger-ui:
    path: /swagger-ui.html
    disable-swagger-default-url: true
    urls:
      - name: customers
        url: /v3/api-docs/customers
      - name: products
        url: /v3/api-docs/products
      - name: cart
        url: /v3/api-docs/cart

eureka:
  client:
    serviceUrl:
      defaultZone: \${EUREKA_CLIENT_SERVICEURL_DEFAULTZONE}

logging:
  level:
    root: DEBUG
    org.springframework.cloud.gateway: DEBUG
    org.springframework.http.server.reactive: DEBUG
    org.springframework.web.reactive: DEBUG
    reactor.ipc.netty: DEBUG
    reactor.netty: DEBUG

server:
  port: 8222

management:
    endpoints:
        web:
            exposure:
                include: health, info, prometheus
    endpoint:
        health:
            show-details: always
`;

export const API_GATEWAY_ROUTES_YML = `
spring:
  cloud:
    gateway:
      server:
        webflux:
          routes:
            - id: customer-microservice
              uri: lb://customer-microservice
              predicates:
                - Path=/api/v1/customers/**,/v3/api-docs/customers
              filters:
                - PreserveHostHeader
                - RewritePath=/v3/api-docs/customers, /v3/api-docs
            - id: product-microservice
              uri: lb://product-microservice
              predicates:
                - Path=/api/v1/products/**,/api/v1/categories/**,/v3/api-docs/products
              filters:
                - PreserveHostHeader
                - RewritePath=/v3/api-docs/products, /v3/api-docs
            - id: cart-microservice
              uri: lb://cart-microservice
              predicates:
                - Path=/api/v1/carts/**,/v3/api-docs/cart
              filters:
                - PreserveHostHeader
                - RewritePath=/v3/api-docs/cart, /v3/api-docs
`;

export const API_GATEWAY_SPRINGDOC_YML = `
springdoc:
  swagger-ui:
    path: /swagger-ui.html
    disable-swagger-default-url: true
    urls:
      - name: customers
        url: /v3/api-docs/customers
      - name: products
        url: /v3/api-docs/products
      - name: cart
        url: /v3/api-docs/cart
`;

export const CUSTOMER_CONFIG_YML = `
spring:
  mongodb:
    uri: \${SPRING_MONGODB_URI}

eureka:
  client:
    service-url:
      defaultZone: \${EUREKA_DEFAULT_ZONE:http://localhost:8761/eureka/}

logging:
  level:
    root: INFO
    com.gustavoleterio.microservices.customer_microservice: WARN
  patterns:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} %-5p [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss.SSS} %-5p [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: logs/customer-microservice.log
    max-size: 10MB
    max-history: 30

server:
  port: 8091
  forward-headers-strategy: framework

management:
    endpoints:
        web:
            exposure:
                include: health, info, prometheus
    endpoint:
        health:
            show-details: always
`;

export const PRODUCT_CONFIG_YML = `
server:
  port: 8092
  forward-headers-strategy: framework

spring:
  datasource:
    url: \${SPRING_DATASOURCE_URL}
    username: \${SPRING_DATASOURCE_USERNAME}
    password: \${SPRING_DATASOURCE_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    properties:
      hibernate:
        format_sql: true
        use_sql_comments: true
        generate_statistics: true
eureka:
  client:
    service-url:
      defaultZone: \${EUREKA_DEFAULT_ZONE:http://localhost:8761/eureka/}

logging:
  level:
    root: INFO
    com.gustavoleterio.microservices.product_microservice: WARN
  patterns:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} %-5p [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss.SSS} %-5p [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: logs/product-microservice.log
    max-size: 10MB
    max-history: 30

management:
    endpoints:
        web:
            exposure:
                include: health, info, prometheus
    endpoint:
        health:
            show-details: always
`;

export const CART_CONFIG_YML = `
spring:
  mongodb:
    uri: \${SPRING_MONGODB_URI}

eureka:
  client:
    service-url:
      defaultZone: \${EUREKA_DEFAULT_ZONE:http://localhost:8761/eureka/}

logging:
  level:
    root: INFO
    com.gustavoleterio.microservices.customer_microservice: WARN
  patterns:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} %-5p [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss.SSS} %-5p [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: logs/customer-microservice.log
    max-size: 10MB
    max-history: 30

server:
  port: 8093
  forward-headers-strategy: framework

management:
    endpoints:
        web:
            exposure:
                include: health, info, prometheus
    endpoint:
        health:
            show-details: always
`;

export const DISCOVERY_CONFIG_YML = `
server:
  port: 8761

eureka:
  instance:
    hostname: localhost
  client:
    registerWithEureka: false
    fetchRegistry: false
    serviceUrl:
      defaultZone: \${EUREKA_CLIENT_SERVICERUL_DEFAULTZONE:http://localhost:8761/eureka/}


management:
    endpoints:
        web:
            exposure:
                include: health, info, prometheus
    endpoint:
        health:
            show-details: always
`;

export const MANAGEMENT_YML = `
management:
    endpoints:
        web:
            exposure:
                include: health, info, prometheus
    endpoint:
        health:
            show-details: always
`;

export const LOGGING_YML = `
logging:
  level:
    root: INFO
    com.gustavoleterio.microservices.product_microservice: WARN
  patterns:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} %-5p [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss.SSS} %-5p [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: logs/product-microservice.log
    max-size: 10MB
    max-history: 30
`;

export const CUSTOMER_APPLICATION_YML = `
spring:
    application:
        name: customer-microservice
    config:
        import: "\${SPRING_CONFIG_IMPORT:optional:configserver:http://localhost:8888}"
`;

export const PRODUCT_APPLICATION_YML = `
spring:
  application:
    name: product-microservice
  config:
    import: "\${SPRING_CONFIG_IMPORT:optional:configserver:http://localhost:8888}"
`;

export const CART_APPLICATION_YML = `
spring:
    application:
        name: cart-microservice
    config:
        import: "\${SPRING_CONFIG_IMPORT:optional:configserver:http://localhost:8888}"
`;

export const DISCOVERY_APPLICATION_YML = `
spring:
    application:
        name: discovery-server
    config:
        import: "\${SPRING_CONFIG_IMPORT:optional:configserver:http://localhost:8888}"
`;

export const API_GATEWAY_APPLICATION_YML = `
spring:
  application:
    name: api-gateway

server:
  port: \${SPRING_CONFIG_IMPORT:optional:configserver:http://localhost:8888}
`;

export const ENV_FILE = `
# MongoDB Configuration
MONGO_DB_USERNAME=root
MONGO_DB_PASSWORD=pass
MONGO_DB_PORT=27017

# PostgreSQL Configuration
POSTGRES_USER=root
POSTGRES_PASSWORD=pass
POSTGRES_PORT=5432

#Gateway Server Configuration
GATEWAY_SERVER_PORT=8222

#Config Server Configuration
CONFIG_SERVER_PORT=8888

#Discovery Server Configuration
DISCOVERY_SERVER_PORT=8761

#Customer Microservice configuration
CUSTOMER_DB_NAME=customer_db
CUSTOMER_MICROSERVICE_PORT=8091

#Product Microservice configuration
PRODUCT_DB_NAME=product_db
PRODUCT_MICROSERVICE_PORT=8092

#Cart Microservice configuration
CART_DB_NAME=cart_db
CART_MICROSERVICE_PORT=8093

#Prometheus Configuration
PROMETHEUS_PORT=9090

#Grafana Configuration
GRAFANA_PORT=3000
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin
`;

export const PROMETHEUS_YML = `
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ecommerce-microservices'
    metrics_path: /actuator/prometheus
    eureka_sd_configs:
      - server: http://discovery-server:8761/eureka
    relabel_configs:
      - source_labels: [__meta_eureka_app_name]
        target_label: application
      - source_labels: [__meta_eureka_instance_status]
        target_label: instance_port
`;

export const LAUNCH_JSON = `
{
  "configurations": [
    {
      "type": "java",
      "name": "Spring Boot-ConfigServerApplication<config-server>",
      "request": "launch",
      "cwd": "\${workspaceFolder}",
      "mainClass": "com.gustavoleterio.config_server.ConfigServerApplication",
      "projectName": "config-server",
      "envFile": "\${workspaceFolder}/.env"
    },
    {
      "type": "java",
      "name": "Spring Boot-CustomerMicroserviceApplication<customer-microservice>",
      "request": "launch",
      "cwd": "\${workspaceFolder}",
      "mainClass": "com.gustavoleterio.microservices.customer_microservice.CustomerMicroserviceApplication",
      "projectName": "customer-microservice",
      "envFile": "\${workspaceFolder}/.env"
    }
  ]
}
`;
