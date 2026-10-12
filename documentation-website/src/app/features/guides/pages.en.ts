import { code, list, note, page, section, steps, table, text, tip, warn, danger } from '../../shared/content/blocks';
import { c, link } from '../../shared/content/html';

export const PAGES_EN = {
  'novo-microservico': page(
    'Create a new microservice',
    'A checklist of how the repository works today — nested Maven, native Config Server, Eureka, Gateway, Compose, and Prometheus via Eureka SD.',
    section(
      'passos',
      'Step by step',
      steps([
        {
          title: 'Maven module',
          html: `Create ${c('microservices/order-microservice/')} (example) with ${c('parent')} = ${c('microservices')}. Declare only what is specific (a queue, another database). The ${c('common-exceptions')} lib comes in as a dependency if it is an MVC REST API.`,
        },
        {
          title: 'Aggregate in the POM',
          html: `Add ${c('<module>order-microservice</module>')} to ${c('microservices/pom.xml')}.`,
        },
        {
          title: 'Spring Boot code',
          html: `${c('@SpringBootApplication')} class in the package ${c('com.gustavoleterio.microservices...')}, package by feature, ${c('application.yml')} with only ${c('spring.application.name')} and ${c('spring.config.import')}.`,
        },
        {
          title: 'YAML in the Config Server',
          html: `File ${c('config-server/src/main/resources/config/order-microservice.yml')} with port, eureka, management, logging, and datasource if there is one.`,
        },
        {
          title: 'Gateway route',
          html: `In ${c('api-gateway.yml')}: ${c('id')}, ${c('uri: lb://order-microservice')}, ${c('Path=/api/v1/orders/**')} and, if you want Swagger, ${c('/v3/api-docs/orders')} + an entry in ${c('springdoc.swagger-ui.urls')}.`,
        },
        {
          title: 'Dockerfile',
          html: `Copy the customer one. Change ${c('-pl microservices/order-microservice')} and the ${c('COPY --from=build')} to that module's target. EXPOSE the YAML port.`,
        },
        {
          title: 'Compose',
          html: `Service with ${c('depends_on')} config + discovery (+ database). ${c('environment')} with ${c('SPRING_CONFIG_IMPORT')} and ${c('EUREKA_DEFAULT_ZONE')}. Only publish ${c('ports')} if you want direct access.`,
        },
        {
          title: 'Prometheus',
          html: `Nothing to do in ${c('prometheus.yml')} if the service registers with Eureka with Actuator + micrometer-registry-prometheus (already inherited). Check /targets.`,
        },
        {
          title: 'Document',
          html: `A profile in the Explorer (data in ${c('shared/data/system')}) and, if the concept is new, a page in the right topic.`,
        },
      ]),
      tip(`Isolated test: ${c('mvn -pl microservices/order-microservice -am spring-boot:run')} with the Config Server already up.`),
    ),
  ),

  'pontos-de-atencao': page(
    'Points of attention',
    'Real behavior of the current code — bugs, study shortcuts, and natural improvements. These are not “documentation errors”: they are in the repository.',
    section(
      'bugs',
      'Bugs',
      danger(
        `${c('CartService')} creates the cart with ${c('List.of()')} (immutable). The first ${c('addItem')} throws ${c('UnsupportedOperationException')} → 500 from ${c('/error')}. Use ${c('new ArrayList<>()')}.`,
        'Empty cart',
      ),
      warn(
        `Gateway: ${c('server.port: ${SPRING_CONFIG_IMPORT:...}')} in the local ${c('application.yml')}. In Docker ${c('SPRING_CONFIG_IMPORT')} saves it; outside Docker, the port becomes a URI string.`,
        'Import in place of the port',
      ),
      warn(
        `Cart logging points at the customer file and logger (a copy). ${c('GlobalExceptionHandler')} returns 500 for a missing route. A duplicate category PUT and a DELETE with children become a constraint 500. ${c('CategoryRequest')} has no ${c('@NotBlank')}.`,
      ),
    ),
    section(
      'estudo',
      'Shortcuts that are fine for study',
      list([
        `${c('ddl-auto: update')} and ${c('latest')} images with no version pin.`,
        'Native Config Server (classpath) instead of Git.',
        'Passwords in .env in plain text.',
        'No authentication, rate limit, circuit breaker, or contract tests.',
      ]),
    ),
    section(
      'melhorias',
      'Improvements that fit',
      list([
        'Dependency cache in the Dockerfiles (POMs first).',
        `Prometheus alerts for ${c('up == 0')}.`,
        'Grafana datasource provisioning.',
        `Take ${c('documentation-website/')} out of the Docker context.`,
        `Remove the dead ${c('config-server:')} key in ${c('networks:')}.`,
        `Have cart inherit the same ${c('ErrorResponse')} / stop swallowing a Feign 404 as 400.`,
      ]),
    ),
  ),

  glossario: page(
    'Glossary',
    'Terms used on this site, in the sense the code applies them.',
    section(
      'termos',
      'Terms',
      table(
        ['Term', 'Meaning here'],
        [
          ['Bounded context', 'Model boundary: customer, product, or cart, each with its own database.'],
          ['BOM', `POM imported only to manage versions (${c('spring-cloud-dependencies')}).`],
          ['Client-side LB', `The caller chooses the instance (Feign, ${c('lb://')}).`],
          ['Config native', 'YAMLs inside the Config Server JAR, not in a Git repo.'],
          ['Database per service', 'No shared table; at most the same Mongo process with two databases.'],
          ['Eureka', 'Instance registry (name, IP, port, status).'],
          ['Feign', 'HTTP client as an annotated interface.'],
          ['East-west', 'Service → service on the internal network.'],
          ['North-south', 'External client → gateway → service.'],
          ['ProblemDetail', `RFC 7807 used by ${c('ResponseEntityExceptionHandler')} in cart.`],
          ['Relaxed binding', `${c('SPRING_CONFIG_IMPORT')} ≡ ${c('spring.config.import')}.`],
          ['RewritePath', 'Gateway filter that changes the path before forwarding.'],
          ['springdoc', 'Generates OpenAPI from Spring code.'],
        ],
      ),
    ),
  ),
};
