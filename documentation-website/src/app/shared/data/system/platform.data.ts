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
import { FROM_ROOT } from './dependencies.data';
import { json } from './examples';

export const API_GATEWAY_SERVICE: ServiceInfo = {
  id: 'api-gateway',
  name: 'api-gateway',
  kind: 'plataforma',
  tagline: 'Porta de entrada única: roteia /api/v1/** para os serviços e agrega o Swagger.',
  description:
    'Ponto único de entrada do tráfego externo (norte-sul). Construído com Spring Cloud Gateway sobre WebFlux/Netty, recebe as requisições na porta 8222, escolhe a rota pelo caminho e encaminha para lb://<serviço>, ou seja, para uma das instâncias registradas no Eureka, balanceada pelo Spring Cloud LoadBalancer. Também publica um Swagger UI que reúne a documentação dos três microserviços.',
  responsibilities: [
    'Rotear /api/v1/customers/**, /api/v1/products/**, /api/v1/categories/** e /api/v1/carts/**.',
    'Balancear a carga entre as réplicas de cada serviço (lb://).',
    'Reescrever /v3/api-docs/{nome} para o /v3/api-docs de cada serviço e servir o Swagger UI agregado.',
  ],
  port: '8222',
  access: 'http://localhost:8222 (porta publicada).',
  image: 'Build local: api-gateway/Dockerfile (multi-stage, eclipse-temurin:25 JDK → JRE alpine)',
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
      origin: 'Declarada no POM do gateway',
      purpose: 'Motor de rotas, predicates e filters (reativo, sobre Netty).',
    },
    {
      artifact: 'spring-cloud-starter-loadbalancer',
      scope: 'compile',
      origin: 'Declarada no POM do gateway (duas vezes)',
      purpose: 'Resolve as URIs lb:// escolhendo uma instância.',
    },
    {
      artifact: 'spring-cloud-starter-netflix-eureka-client',
      scope: 'compile',
      origin: 'Declarada no POM do gateway',
      purpose: 'Descobre as instâncias dos serviços no Eureka.',
    },
    {
      artifact: 'spring-cloud-starter-config',
      scope: 'compile',
      origin: 'Declarada no POM do gateway',
      purpose: 'Recebe as rotas e demais properties do Config Server.',
    },
    {
      artifact: 'org.springdoc:springdoc-openapi-starter-webflux-ui (3.1.1)',
      scope: 'compile',
      origin: 'Declarada no POM do gateway',
      purpose: 'Swagger UI na versão reativa (o gateway não usa Spring MVC).',
    },
    {
      artifact: 'io.projectreactor:reactor-test',
      scope: 'test',
      origin: 'Declarada no POM do gateway',
      purpose: 'StepVerifier e utilitários de teste reativo.',
    },
    ...FROM_ROOT,
  ],
  relations: [
    { label: 'Encaminha para', targets: ['customer-microservice', 'product-microservice', 'cart-microservice'] },
    { label: 'Depende de', targets: ['config-server', 'discovery-server'] },
    { label: 'Monitorado por', targets: ['prometheus'] },
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
      name: 'Rota inexistente',
      status: '404 Not Found',
      when: 'Nenhum predicate casa com o caminho (ex.: /api/v2/...).',
      handler: 'DefaultErrorWebExceptionHandler (Spring Boot WebFlux)',
    },
    {
      name: 'NotFoundException do LoadBalancer',
      status: '503 Service Unavailable',
      when: '"Unable to find instance for ...": o serviço ainda não se registrou no Eureka ou está fora do ar.',
      handler: 'ReactiveLoadBalancerClientFilter → DefaultErrorWebExceptionHandler',
    },
    {
      name: 'Erros dos serviços',
      status: 'Repassados sem alteração',
      when: '400, 404, 409, 500... gerados pelos microserviços chegam ao cliente como foram produzidos.',
      handler: '—',
    },
  ],
  config: [
    {
      language: 'yaml',
      code: API_GATEWAY_CONFIG_YML,
      file: 'config-server/src/main/resources/config/api-gateway.yml',
      caption: 'Rotas, Swagger agregado, Eureka, logs em DEBUG e porta: tudo vem do Config Server.',
    },
    {
      language: 'yaml',
      code: API_GATEWAY_APPLICATION_YML,
      file: 'api-gateway/src/main/resources/application.yml',
      caption: 'Atenção: o placeholder de import foi colocado em server.port (veja Pontos de atenção).',
    },
    { language: 'yaml', code: COMPOSE_API_GATEWAY, file: 'docker-compose.yml' },
    { language: 'xml', code: API_GATEWAY_POM, file: 'api-gateway/pom.xml' },
  ],
  env: [
    {
      name: 'SPRING_CONFIG_IMPORT',
      value: 'configserver:http://config-server:8888',
      purpose: 'Por relaxed binding vira spring.config.import, que é o que realmente importa a configuração.',
    },
    {
      name: 'EUREKA_CLIENT_SERVICEURL_DEFAULTZONE',
      value: 'http://discovery-server:8761/eureka/',
      purpose: 'Resolve o placeholder obrigatório do api-gateway.yml (sem valor padrão).',
    },
  ],
  links: [
    { label: 'Swagger UI agregado', url: 'http://localhost:8222/swagger-ui.html' },
    { label: 'Health', url: 'http://localhost:8222/actuator/health' },
    { label: 'Métricas Prometheus', url: 'http://localhost:8222/actuator/prometheus' },
  ],
  sourceFiles: [
    { path: 'api-gateway/src/main/java/com/gustavoleterio/api_gateway/ApiGatewayApplication.java', role: 'Classe main (sem código de rota: tudo é configuração).' },
    { path: 'config-server/src/main/resources/config/api-gateway.yml', role: 'Rotas e Swagger agregado.' },
  ],
  docs: [
    { label: 'API Gateway', path: '/arquitetura/api-gateway' },
    { label: 'Swagger no gateway', path: '/observabilidade/swagger-no-gateway' },
    { label: 'Load balancer', path: '/arquitetura/load-balancer' },
  ],
};

export const CONFIG_SERVER_SERVICE: ServiceInfo = {
  id: 'config-server',
  name: 'config-server',
  kind: 'plataforma',
  tagline: 'Servidor de configuração centralizada (Spring Cloud Config, perfil native).',
  description:
    'Guarda e serve as properties de todos os outros serviços. Roda com o perfil native, lendo os arquivos YAML de classpath:/config: cada serviço recebe o arquivo com o mesmo nome do seu spring.application.name. É o primeiro container a subir: todos os demais dependem do seu healthcheck.',
  responsibilities: [
    'Servir a configuração de api-gateway, discovery-server, customer, product e cart.',
    'Expor GET /{aplicação}/{perfil} com as property sources de cada serviço.',
  ],
  port: '8888',
  access: 'http://localhost:8888 (porta publicada).',
  image: 'Build local: config-server/Dockerfile (o único Dockerfile com os passos comentados)',
  technologies: ['Spring Cloud Config Server', 'Perfil native (classpath)', 'Actuator + Micrometer'],
  dependencies: [
    {
      artifact: 'spring-cloud-config-server',
      scope: 'compile',
      origin: 'Declarada no POM do config-server',
      purpose: 'Habilita @EnableConfigServer e a API REST de configuração.',
    },
    ...FROM_ROOT,
  ],
  relations: [
    {
      label: 'Fornece configuração para',
      targets: ['api-gateway', 'discovery-server', 'customer-microservice', 'product-microservice', 'cart-microservice'],
    },
  ],
  endpointGroups: [
    {
      title: 'API do Config Server',
      basePath: '/',
      description: 'Endpoints padrão do Spring Cloud Config. Os clientes os chamam automaticamente na inicialização.',
      endpoints: [
        {
          id: 'config-get',
          method: 'GET',
          path: '/{application}/{profile}',
          summary: 'Devolve as property sources de uma aplicação/perfil.',
          description:
            'Os placeholders (${...}) são devolvidos sem resolver: quem os resolve é o cliente, com as próprias variáveis de ambiente. Uma aplicação sem arquivo devolve 200 com propertySources vazio.',
          handler: 'EnvironmentController (Spring Cloud Config Server)',
          params: [
            { name: 'application', in: 'path', type: 'String', description: 'spring.application.name do cliente, ex.: customer-microservice.' },
            { name: 'profile', in: 'path', type: 'String', description: 'Perfil ativo, ex.: default.' },
          ],
          responses: [
            {
              status: 200,
              description: 'Exemplo: GET /customer-microservice/default (resumido).',
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
          summary: 'Mesma configuração, já mesclada e no formato YAML.',
          handler: 'EnvironmentController (Spring Cloud Config Server)',
          params: [{ name: 'application-profile', in: 'path', type: 'String', description: 'Ex.: /product-microservice-default.yml' }],
          responses: [{ status: 200, description: 'Documento YAML.', contentType: 'text/plain' }],
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
    { label: 'Config do customer', url: 'http://localhost:8888/customer-microservice/default' },
    { label: 'Config do gateway', url: 'http://localhost:8888/api-gateway/default' },
    { label: 'Health', url: 'http://localhost:8888/actuator/health' },
  ],
  sourceFiles: [
    { path: 'config-server/src/main/java/com/gustavoleterio/config_server/ConfigServerApplication.java', role: 'Classe main com @EnableConfigServer.' },
    { path: 'config-server/src/main/resources/application.yml', role: 'Perfil native e search-locations.' },
    { path: 'config-server/src/main/resources/config/*.yml', role: 'Um arquivo por serviço cliente.' },
  ],
  docs: [
    { label: 'Centralização de configurações', path: '/arquitetura/config-server' },
    { label: 'Import de properties', path: '/arquitetura/import-de-properties' },
  ],
};

export const DISCOVERY_SERVER_SERVICE: ServiceInfo = {
  id: 'discovery-server',
  name: 'discovery-server',
  kind: 'plataforma',
  tagline: 'Registro de serviços (Netflix Eureka Server).',
  description:
    'Catálogo vivo das instâncias em execução. Cada serviço se registra com nome, IP e porta e envia heartbeats; o gateway, o cart (Feign) e o Prometheus consultam o registro para descobrir onde cada serviço está, sem endereços fixos.',
  responsibilities: [
    'Manter o registro das instâncias de gateway, customer, product e cart.',
    'Servir o painel web e a API REST /eureka/apps.',
    'Ser a fonte de service discovery do Prometheus (eureka_sd_configs).',
  ],
  port: '8761',
  access: 'Painel em http://localhost:8761 (porta publicada).',
  image: 'Build local: discovery-server/Dockerfile (multi-stage, eclipse-temurin:25 JDK → JRE alpine)',
  technologies: ['Spring Cloud Netflix Eureka Server', 'Spring Cloud Config Client', 'Actuator + Micrometer'],
  dependencies: [
    {
      artifact: 'spring-cloud-starter-netflix-eureka-server',
      scope: 'compile',
      origin: 'Declarada no POM do discovery-server',
      purpose: 'Servidor Eureka (@EnableEurekaServer) com painel web.',
    },
    {
      artifact: 'spring-cloud-starter-config',
      scope: 'compile',
      origin: 'Declarada no POM do discovery-server',
      purpose: 'Recebe a própria configuração do Config Server.',
    },
    ...FROM_ROOT,
  ],
  relations: [
    { label: 'Recebe registros de', targets: ['api-gateway', 'customer-microservice', 'product-microservice', 'cart-microservice'] },
    { label: 'Consultado por', targets: ['api-gateway', 'cart-microservice', 'prometheus'] },
    { label: 'Depende de', targets: ['config-server'] },
  ],
  endpointGroups: [
    {
      title: 'API REST do Eureka',
      basePath: '/eureka',
      description: 'Usada pelos clientes Eureka e pelo Prometheus. Responde XML por padrão; envie Accept: application/json para JSON.',
      endpoints: [
        {
          id: 'eureka-apps',
          method: 'GET',
          path: '/eureka/apps',
          summary: 'Lista todas as aplicações e instâncias registradas.',
          handler: 'Eureka Server (ApplicationsResource)',
          responses: [
            {
              status: 200,
              description: 'Registro completo (resumido).',
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
          summary: 'Instâncias de uma aplicação específica.',
          handler: 'Eureka Server (ApplicationResource)',
          params: [{ name: 'APP_NAME', in: 'path', type: 'String', description: 'Nome em maiúsculas, ex.: CART-MICROSERVICE.' }],
          responses: [{ status: 200, description: 'Aplicação e suas instâncias.', contentType: 'application/json' }],
          errors: [{ status: 404, cause: 'Aplicação não registrada.', source: 'Eureka Server' }],
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
      caption: 'registerWithEureka/fetchRegistry false: o servidor não se registra nele mesmo.',
    },
    { language: 'yaml', code: COMPOSE_DISCOVERY_SERVER, file: 'docker-compose.yml' },
    { language: 'xml', code: DISCOVERY_SERVER_POM, file: 'discovery-server/pom.xml' },
  ],
  env: [{ name: 'SPRING_CONFIG_IMPORT', value: 'configserver:http://config-server:8888', purpose: 'Endereço do Config Server.' }],
  links: [
    { label: 'Painel do Eureka', url: 'http://localhost:8761' },
    { label: 'Registro (XML)', url: 'http://localhost:8761/eureka/apps' },
    { label: 'Health', url: 'http://localhost:8761/actuator/health' },
  ],
  sourceFiles: [
    {
      path: 'discovery-server/src/main/java/com/gustavoleterio/discovery_server/DiscoveryServerApplication.java',
      role: 'Classe main com @EnableEurekaServer.',
    },
  ],
  docs: [{ label: 'Eureka', path: '/arquitetura/eureka' }],
};
