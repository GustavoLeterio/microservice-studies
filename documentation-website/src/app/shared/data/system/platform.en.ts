import {
  API_GATEWAY_APPLICATION_YML,
  API_GATEWAY_CONFIG_YML,
  CONFIG_SERVER_APPLICATION_YML,
  DISCOVERY_APPLICATION_YML,
  DISCOVERY_CONFIG_YML,
} from '../../content/snippets/config.snippets';
import {
  COMPOSE_API_GATEWAY,
  COMPOSE_CONFIG_SERVER,
  COMPOSE_DISCOVERY_SERVER,
} from '../../content/snippets/docker.snippets';
import { API_GATEWAY_POM, CONFIG_SERVER_POM, DISCOVERY_SERVER_POM } from '../../content/snippets/maven.snippets';
import { ServiceInfo } from '../../models/system.models';
import { FROM_ROOT_EN } from './dependencies.en';
import { json } from './examples.en';

export const API_GATEWAY_SERVICE_EN: ServiceInfo = {
  id: 'api-gateway',
  name: 'api-gateway',
  kind: 'plataforma',
  tagline: 'Single entry point: routes /api/v1/** to the services and aggregates Swagger.',
  description:
    'Single entry point for external (north-south) traffic. Built with Spring Cloud Gateway on WebFlux/Netty, it receives requests on port 8222, picks the route by path, and forwards to lb://<service> — that is, to one of the instances registered in Eureka, load-balanced by Spring Cloud LoadBalancer. It also publishes a Swagger UI that gathers documentation from the three microservices.',
  responsibilities: [
    'Route /api/v1/customers/**, /api/v1/products/**, /api/v1/categories/**, and /api/v1/carts/**.',
    'Balance load across the replicas of each service (lb://).',
    'Rewrite /v3/api-docs/{name} to each service\'s /v3/api-docs and serve the aggregated Swagger UI.',
  ],
  port: '8222',
  access: 'http://localhost:8222 (published port).',
  image: 'Local build: api-gateway/Dockerfile (multi-stage, eclipse-temurin:25 JDK → JRE alpine)',
  technologies: [
    'Spring Cloud Gateway Server WebFlux',
    'Spring WebFlux / Netty',
    'Spring Cloud LoadBalancer',
    'Eureka Client',
    'Spring Cloud Config Client',
    'springdoc-openapi (webflux-ui)',
    'Actuator + Micrometer',
  ],
  dependencies: [
    {
      artifact: 'spring-cloud-starter-gateway-server-webflux',
      scope: 'compile',
      origin: 'Declared in the gateway POM',
      purpose: 'Route engine, predicates, and filters (reactive, on Netty).',
    },
    {
      artifact: 'spring-cloud-starter-loadbalancer',
      scope: 'compile',
      origin: 'Declared in the gateway POM (twice)',
      purpose: 'Resolves lb:// URIs by choosing an instance.',
    },
    {
      artifact: 'spring-cloud-starter-netflix-eureka-client',
      scope: 'compile',
      origin: 'Declared in the gateway POM',
      purpose: 'Discovers service instances in Eureka.',
    },
    {
      artifact: 'spring-cloud-starter-config',
      scope: 'compile',
      origin: 'Declared in the gateway POM',
      purpose: 'Receives routes and other properties from the Config Server.',
    },
    {
      artifact: 'org.springdoc:springdoc-openapi-starter-webflux-ui (3.1.1)',
      scope: 'compile',
      origin: 'Declared in the gateway POM',
      purpose: 'Swagger UI in the reactive variant (the gateway does not use Spring MVC).',
    },
    {
      artifact: 'io.projectreactor:reactor-test',
      scope: 'test',
      origin: 'Declared in the gateway POM',
      purpose: 'StepVerifier and reactive test utilities.',
    },
    ...FROM_ROOT_EN,
  ],
  relations: [
    { label: 'Forwards to', targets: ['customer-microservice', 'product-microservice', 'cart-microservice'] },
    { label: 'Depends on', targets: ['config-server', 'discovery-server'] },
    { label: 'Monitored by', targets: ['prometheus'] },
  ],
  routes: [
    {
      id: 'customer-microservice',
      predicates: ['Path=/api/v1/customers/**', 'Path=/v3/api-docs/customers'],
      uri: 'lb://customer-microservice',
      filters: ['PreserveHostHeader', 'RewritePath=/v3/api-docs/customers, /v3/api-docs'],
    },
    {
      id: 'product-microservice',
      predicates: ['Path=/api/v1/products/**', 'Path=/api/v1/categories/**', 'Path=/v3/api-docs/products'],
      uri: 'lb://product-microservice',
      filters: ['PreserveHostHeader', 'RewritePath=/v3/api-docs/products, /v3/api-docs'],
    },
    {
      id: 'cart-microservice',
      predicates: ['Path=/api/v1/carts/**', 'Path=/v3/api-docs/cart'],
      uri: 'lb://cart-microservice',
      filters: ['PreserveHostHeader', 'RewritePath=/v3/api-docs/cart, /v3/api-docs'],
    },
  ],
  exceptions: [
    {
      name: 'Unknown route',
      status: '404 Not Found',
      when: 'No predicate matches the path (for example, /api/v2/...).',
      handler: 'DefaultErrorWebExceptionHandler (Spring Boot WebFlux)',
    },
    {
      name: 'LoadBalancer NotFoundException',
      status: '503 Service Unavailable',
      when: '"Unable to find instance for ...": the service has not registered with Eureka yet, or it is down.',
      handler: 'ReactiveLoadBalancerClientFilter → DefaultErrorWebExceptionHandler',
    },
    {
      name: 'Service errors',
      status: 'Passed through unchanged',
      when: '400, 404, 409, 500... produced by the microservices reach the client as they were produced.',
      handler: '—',
    },
  ],
  config: [
    {
      language: 'yaml',
      code: API_GATEWAY_CONFIG_YML,
      file: 'config-server/src/main/resources/config/api-gateway.yml',
      caption: 'Routes, aggregated Swagger, Eureka, DEBUG logs, and port: everything comes from the Config Server.',
    },
    {
      language: 'yaml',
      code: API_GATEWAY_APPLICATION_YML,
      file: 'api-gateway/src/main/resources/application.yml',
      caption: 'Note: the import placeholder was placed in server.port (see Points of attention).',
    },
    { language: 'yaml', code: COMPOSE_API_GATEWAY, file: 'docker-compose.yml' },
    { language: 'xml', code: API_GATEWAY_POM, file: 'api-gateway/pom.xml' },
  ],
  env: [
    {
      name: 'SPRING_CONFIG_IMPORT',
      value: 'configserver:http://config-server:8888',
      purpose: 'Through relaxed binding this becomes spring.config.import, which is what actually imports the configuration.',
    },
    {
      name: 'EUREKA_CLIENT_SERVICEURL_DEFAULTZONE',
      value: 'http://discovery-server:8761/eureka/',
      purpose: 'Resolves the required placeholder in api-gateway.yml (no default value).',
    },
  ],
  links: [
    { label: 'Aggregated Swagger UI', url: 'http://localhost:8222/swagger-ui.html' },
    { label: 'Health', url: 'http://localhost:8222/actuator/health' },
    { label: 'Prometheus metrics', url: 'http://localhost:8222/actuator/prometheus' },
  ],
  sourceFiles: [
    { path: 'api-gateway/src/main/java/com/gustavoleterio/api_gateway/ApiGatewayApplication.java', role: 'Main class (no route code: everything is configuration).' },
    { path: 'config-server/src/main/resources/config/api-gateway.yml', role: 'Routes and aggregated Swagger.' },
  ],
  docs: [
    { label: 'API Gateway', path: '/arquitetura/api-gateway' },
    { label: 'Swagger on the gateway', path: '/observabilidade/swagger-no-gateway' },
    { label: 'Load balancer', path: '/arquitetura/load-balancer' },
  ],
};

export const CONFIG_SERVER_SERVICE_EN: ServiceInfo = {
  id: 'config-server',
  name: 'config-server',
  kind: 'plataforma',
  tagline: 'Centralized configuration server (Spring Cloud Config, native profile).',
  description:
    'Stores and serves the properties of every other service. It runs with the native profile, reading YAML files from classpath:/config: each service receives the file named after its spring.application.name. It is the first container to start: every other service depends on its healthcheck.',
  responsibilities: [
    'Serve configuration for api-gateway, discovery-server, customer, product, and cart.',
    'Expose GET /{application}/{profile} with each service\'s property sources.',
  ],
  port: '8888',
  access: 'http://localhost:8888 (published port).',
  image: 'Local build: config-server/Dockerfile (the only Dockerfile whose steps are commented)',
  technologies: ['Spring Cloud Config Server', 'Native profile (classpath)', 'Actuator + Micrometer'],
  dependencies: [
    {
      artifact: 'spring-cloud-config-server',
      scope: 'compile',
      origin: 'Declared in the config-server POM',
      purpose: 'Enables @EnableConfigServer and the configuration REST API.',
    },
    ...FROM_ROOT_EN,
  ],
  relations: [
    {
      label: 'Provides configuration to',
      targets: ['api-gateway', 'discovery-server', 'customer-microservice', 'product-microservice', 'cart-microservice'],
    },
  ],
  endpointGroups: [
    {
      title: 'Config Server API',
      basePath: '/',
      description: 'Standard Spring Cloud Config endpoints. Clients call them automatically at startup.',
      endpoints: [
        {
          id: 'config-get',
          method: 'GET',
          path: '/{application}/{profile}',
          summary: 'Returns the property sources for an application/profile.',
          description:
            'Placeholders (${...}) are returned unresolved: the client resolves them with its own environment variables. An application with no file returns 200 with empty propertySources.',
          handler: 'EnvironmentController (Spring Cloud Config Server)',
          params: [
            { name: 'application', in: 'path', type: 'String', description: "The client's spring.application.name, for example customer-microservice." },
            { name: 'profile', in: 'path', type: 'String', description: 'Active profile, for example default.' },
          ],
          responses: [
            {
              status: 200,
              description: 'Example: GET /customer-microservice/default (abbreviated).',
              contentType: 'application/json',
              example: json({
                name: 'customer-microservice',
                profiles: ['default'],
                label: null,
                version: null,
                state: null,
                propertySources: [
                  {
                    name: "Config resource 'class path resource [config/customer-microservice.yml]' via location 'classpath:/config'",
                    source: {
                      'spring.mongodb.uri': '${SPRING_MONGODB_URI}',
                      'eureka.client.service-url.defaultZone': '${EUREKA_DEFAULT_ZONE:http://localhost:8761/eureka/}',
                      'server.port': 8091,
                      'logging.file.name': 'logs/customer-microservice.log',
                    },
                  },
                ],
              }),
            },
          ],
          errors: [],
        },
        {
          id: 'config-get-yml',
          method: 'GET',
          path: '/{application}-{profile}.yml',
          summary: 'The same configuration, already merged and in YAML format.',
          handler: 'EnvironmentController (Spring Cloud Config Server)',
          params: [{ name: 'application-profile', in: 'path', type: 'String', description: 'For example, /product-microservice-default.yml' }],
          responses: [{ status: 200, description: 'YAML document.', contentType: 'text/plain' }],
          errors: [],
        },
      ],
    },
  ],
  config: [
    { language: 'yaml', code: CONFIG_SERVER_APPLICATION_YML, file: 'config-server/src/main/resources/application.yml' },
    { language: 'yaml', code: COMPOSE_CONFIG_SERVER, file: 'docker-compose.yml' },
    { language: 'xml', code: CONFIG_SERVER_POM, file: 'config-server/pom.xml' },
  ],
  links: [
    { label: 'Customer config', url: 'http://localhost:8888/customer-microservice/default' },
    { label: 'Gateway config', url: 'http://localhost:8888/api-gateway/default' },
    { label: 'Health', url: 'http://localhost:8888/actuator/health' },
  ],
  sourceFiles: [
    { path: 'config-server/src/main/java/com/gustavoleterio/config_server/ConfigServerApplication.java', role: 'Main class with @EnableConfigServer.' },
    { path: 'config-server/src/main/resources/application.yml', role: 'Native profile and search-locations.' },
    { path: 'config-server/src/main/resources/config/*.yml', role: 'One file per client service.' },
  ],
  docs: [
    { label: 'Configuration centralization', path: '/arquitetura/config-server' },
    { label: 'Property import', path: '/arquitetura/import-de-properties' },
  ],
};

export const DISCOVERY_SERVER_SERVICE_EN: ServiceInfo = {
  id: 'discovery-server',
  name: 'discovery-server',
  kind: 'plataforma',
  tagline: 'Service registry (Netflix Eureka Server).',
  description:
    'Live catalog of running instances. Each service registers with name, IP, and port and sends heartbeats; the gateway, cart (Feign), and Prometheus query the registry to find where each service is, without fixed addresses.',
  responsibilities: [
    'Keep the registry of gateway, customer, product, and cart instances.',
    'Serve the web dashboard and the /eureka/apps REST API.',
    'Be the service-discovery source for Prometheus (eureka_sd_configs).',
  ],
  port: '8761',
  access: 'Dashboard at http://localhost:8761 (published port).',
  image: 'Local build: discovery-server/Dockerfile (multi-stage, eclipse-temurin:25 JDK → JRE alpine)',
  technologies: ['Spring Cloud Netflix Eureka Server', 'Spring Cloud Config Client', 'Actuator + Micrometer'],
  dependencies: [
    {
      artifact: 'spring-cloud-starter-netflix-eureka-server',
      scope: 'compile',
      origin: 'Declared in the discovery-server POM',
      purpose: 'Eureka server (@EnableEurekaServer) with a web dashboard.',
    },
    {
      artifact: 'spring-cloud-starter-config',
      scope: 'compile',
      origin: 'Declared in the discovery-server POM',
      purpose: 'Receives its own configuration from the Config Server.',
    },
    ...FROM_ROOT_EN,
  ],
  relations: [
    { label: 'Receives registrations from', targets: ['api-gateway', 'customer-microservice', 'product-microservice', 'cart-microservice'] },
    { label: 'Queried by', targets: ['api-gateway', 'cart-microservice', 'prometheus'] },
    { label: 'Depends on', targets: ['config-server'] },
  ],
  endpointGroups: [
    {
      title: 'Eureka REST API',
      basePath: '/eureka',
      description: 'Used by Eureka clients and by Prometheus. Responds with XML by default; send Accept: application/json for JSON.',
      endpoints: [
        {
          id: 'eureka-apps',
          method: 'GET',
          path: '/eureka/apps',
          summary: 'Lists every registered application and instance.',
          handler: 'Eureka Server (ApplicationsResource)',
          responses: [
            {
              status: 200,
              description: 'Full registry (abbreviated).',
              contentType: 'application/json',
              example: json({
                applications: {
                  application: [
                    {
                      name: 'PRODUCT-MICROSERVICE',
                      instance: [
                        { instanceId: '3f2a9c1b7d4e:product-microservice:8092', hostName: '3f2a9c1b7d4e', ipAddr: '172.18.0.9', app: 'PRODUCT-MICROSERVICE', status: 'UP', port: { $: 8092 } },
                        { instanceId: '8c1d2e3f4a5b:product-microservice:8092', hostName: '8c1d2e3f4a5b', ipAddr: '172.18.0.10', app: 'PRODUCT-MICROSERVICE', status: 'UP', port: { $: 8092 } },
                      ],
                    },
                  ],
                },
              }),
            },
          ],
          errors: [],
        },
        {
          id: 'eureka-app',
          method: 'GET',
          path: '/eureka/apps/{APP_NAME}',
          summary: 'Instances of a specific application.',
          handler: 'Eureka Server (ApplicationResource)',
          params: [{ name: 'APP_NAME', in: 'path', type: 'String', description: 'Uppercase name, for example CART-MICROSERVICE.' }],
          responses: [{ status: 200, description: 'Application and its instances.', contentType: 'application/json' }],
          errors: [{ status: 404, cause: 'Application not registered.', source: 'Eureka Server' }],
        },
      ],
    },
  ],
  config: [
    { language: 'yaml', code: DISCOVERY_APPLICATION_YML, file: 'discovery-server/src/main/resources/application.yml' },
    {
      language: 'yaml',
      code: DISCOVERY_CONFIG_YML,
      file: 'config-server/src/main/resources/config/discovery-server.yml',
      caption: 'registerWithEureka/fetchRegistry false: the server does not register with itself.',
    },
    { language: 'yaml', code: COMPOSE_DISCOVERY_SERVER, file: 'docker-compose.yml' },
    { language: 'xml', code: DISCOVERY_SERVER_POM, file: 'discovery-server/pom.xml' },
  ],
  env: [{ name: 'SPRING_CONFIG_IMPORT', value: 'configserver:http://config-server:8888', purpose: 'Config Server address.' }],
  links: [
    { label: 'Eureka dashboard', url: 'http://localhost:8761' },
    { label: 'Registry (XML)', url: 'http://localhost:8761/eureka/apps' },
    { label: 'Health', url: 'http://localhost:8761/actuator/health' },
  ],
  sourceFiles: [
    {
      path: 'discovery-server/src/main/java/com/gustavoleterio/discovery_server/DiscoveryServerApplication.java',
      role: 'Main class with @EnableEurekaServer.',
    },
  ],
  docs: [{ label: 'Eureka', path: '/arquitetura/eureka' }],
};
