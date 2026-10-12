import { ServiceDependency } from '../../models/system.models';

const ROOT = 'Inherited from the root POM (ecommerce)';
const MICROSERVICES = 'Inherited from the microservices POM';

/** Dependencies declared in the root POM <dependencies>: every module receives them. */
export const FROM_ROOT_EN: ServiceDependency[] = [
  {
    artifact: 'org.projectlombok:lombok',
    scope: 'compile (optional)',
    origin: ROOT,
    purpose: 'Generates getters, setters, constructors, builders, and loggers at compile time.',
  },
  {
    artifact: 'spring-boot-starter-actuator',
    scope: 'compile',
    origin: ROOT,
    purpose: 'Operational endpoints: /actuator/health, /actuator/info, and /actuator/prometheus.',
  },
  {
    artifact: 'io.micrometer:micrometer-registry-prometheus',
    scope: 'compile',
    origin: ROOT,
    purpose: 'Publishes Micrometer metrics in the text format Prometheus reads.',
  },
  {
    artifact: 'spring-boot-starter-test',
    scope: 'test',
    origin: ROOT,
    purpose: 'JUnit 5, AssertJ, Mockito, and Spring test support.',
  },
];

/** Dependencies from the microservices aggregator POM: only the business services (and the library) receive them. */
export const FROM_MICROSERVICES_EN: ServiceDependency[] = [
  {
    artifact: 'spring-boot-starter-webmvc',
    scope: 'compile',
    origin: MICROSERVICES,
    purpose: 'REST API with Spring MVC running on embedded Tomcat.',
  },
  {
    artifact: 'spring-boot-starter-validation',
    scope: 'compile',
    origin: MICROSERVICES,
    purpose: 'Bean Validation (Hibernate Validator): @NotBlank, @Email, @NotNull, and @Min with @Valid.',
  },
  {
    artifact: 'spring-cloud-starter-config',
    scope: 'compile',
    origin: MICROSERVICES,
    purpose: 'Config Server client: loads properties through spring.config.import.',
  },
  {
    artifact: 'spring-cloud-starter-netflix-eureka-client',
    scope: 'compile',
    origin: MICROSERVICES,
    purpose: 'Registers the instance with Eureka and lets the service discover others by name.',
  },
  {
    artifact: 'org.springdoc:springdoc-openapi-starter-webmvc-ui (3.1.1)',
    scope: 'compile',
    origin: MICROSERVICES,
    purpose: 'Generates the OpenAPI specification at /v3/api-docs and the Swagger UI.',
  },
  {
    artifact: 'spring-boot-starter-validation-test, spring-boot-starter-webmvc-test',
    scope: 'test',
    origin: MICROSERVICES,
    purpose: 'Test support for the web layer and for validation.',
  },
];

export const COMMON_EXCEPTIONS_DEPENDENCY_EN: ServiceDependency = {
  artifact: 'com.gustavoleterio.microservices:common-exceptions',
  scope: 'compile',
  origin: 'Declared in the service POM (version managed in the microservices POM)',
  purpose: 'Internal library with the ErrorResponse record and the GlobalExceptionHandler.',
};
