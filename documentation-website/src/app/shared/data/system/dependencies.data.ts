import { ServiceDependency } from '../../models/system.models';

const ROOT = 'Herdada do POM raiz (ecommerce)';
const MICROSERVICES = 'Herdada do POM microservices';

/** Dependências declaradas em <dependencies> do POM raiz: todo módulo as recebe. */
export const FROM_ROOT: ServiceDependency[] = [
  {
    artifact: 'org.projectlombok:lombok',
    scope: 'compile (optional)',
    origin: ROOT,
    purpose: 'Gera getters, setters, construtores, builders e loggers em tempo de compilação.',
  },
  {
    artifact: 'spring-boot-starter-actuator',
    scope: 'compile',
    origin: ROOT,
    purpose: 'Endpoints operacionais: /actuator/health, /actuator/info e /actuator/prometheus.',
  },
  {
    artifact: 'io.micrometer:micrometer-registry-prometheus',
    scope: 'compile',
    origin: ROOT,
    purpose: 'Publica as métricas do Micrometer no formato texto lido pelo Prometheus.',
  },
  {
    artifact: 'spring-boot-starter-test',
    scope: 'test',
    origin: ROOT,
    purpose: 'JUnit 5, AssertJ, Mockito e o suporte de testes do Spring.',
  },
];

/** Dependências do POM agregador microservices: só os serviços de negócio (e a lib) as recebem. */
export const FROM_MICROSERVICES: ServiceDependency[] = [
  {
    artifact: 'spring-boot-starter-webmvc',
    scope: 'compile',
    origin: MICROSERVICES,
    purpose: 'API REST com Spring MVC rodando sobre Tomcat embarcado.',
  },
  {
    artifact: 'spring-boot-starter-validation',
    scope: 'compile',
    origin: MICROSERVICES,
    purpose: 'Bean Validation (Hibernate Validator): @NotBlank, @Email, @NotNull, @Min com @Valid.',
  },
  {
    artifact: 'spring-cloud-starter-config',
    scope: 'compile',
    origin: MICROSERVICES,
    purpose: 'Cliente do Config Server: busca as properties via spring.config.import.',
  },
  {
    artifact: 'spring-cloud-starter-netflix-eureka-client',
    scope: 'compile',
    origin: MICROSERVICES,
    purpose: 'Registra a instância no Eureka e permite descobrir outros serviços pelo nome.',
  },
  {
    artifact: 'org.springdoc:springdoc-openapi-starter-webmvc-ui (3.1.1)',
    scope: 'compile',
    origin: MICROSERVICES,
    purpose: 'Gera a especificação OpenAPI em /v3/api-docs e o Swagger UI.',
  },
  {
    artifact: 'spring-boot-starter-validation-test, spring-boot-starter-webmvc-test',
    scope: 'test',
    origin: MICROSERVICES,
    purpose: 'Suporte a testes da camada web e da validação.',
  },
];

export const COMMON_EXCEPTIONS_DEPENDENCY: ServiceDependency = {
  artifact: 'com.gustavoleterio.microservices:common-exceptions',
  scope: 'compile',
  origin: 'Declarada no POM do serviço (versão gerenciada no POM microservices)',
  purpose: 'Biblioteca interna com o record ErrorResponse e o GlobalExceptionHandler.',
};
