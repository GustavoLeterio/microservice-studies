import { architectureDiagram, cards, code, flow, list, note, page, section, table, text, tip } from '../../shared/content/blocks';
import { c, link } from '../../shared/content/html';
import { ENV_FILE } from '../../shared/content/snippets/config.snippets';

export const PAGES_EN = {
  'o-sistema': page(
    'The system',
    'A teaching e-commerce built as microservices: customer registration, a product catalog, and a shopping cart, behind a single gateway.',
    section(
      'dominio',
      'Domain',
      text(
        `The repository models the smallest slice of a store. There is no payment, order, or authentication: the goal is to exercise the <strong>platform</strong> (central configuration, discovery, routing, observability) on top of three clear bounded contexts.`,
      ),
      cards([
        {
          title: 'Customers',
          tag: 'MongoDB',
          link: '/explorador/servicos/customer-microservice',
          html: 'Registration CRUD. The source of truth for who the customer is.',
        },
        {
          title: 'Products',
          tag: 'PostgreSQL',
          link: '/explorador/servicos/product-microservice',
          html: 'Categories and products with price and stock. The only relational service.',
        },
        {
          title: 'Cart',
          tag: 'MongoDB + Feign',
          link: '/explorador/servicos/cart-microservice',
          html: 'One cart per customer. Validates the customer, the product, and stock in other services.',
        },
      ]),
    ),
    section(
      'pecas',
      'Pieces beyond the business',
      table(
        ['Piece', 'Role'],
        [
          [`${link('/explorador/servicos/config-server', 'config-server')} (:8888)`, 'Serves each application\'s YAML.'],
          [`${link('/explorador/servicos/discovery-server', 'discovery-server')} (:8761)`, 'Eureka registry of instances.'],
          [`${link('/explorador/servicos/api-gateway', 'api-gateway')} (:8222)`, 'The only external HTTP entry point.'],
          [`${link('/explorador/servicos/mongodb', 'MongoDB')} and ${link('/explorador/servicos/postgres', 'PostgreSQL')}`, 'Persistence per service (separate logical databases).'],
          [`${link('/explorador/servicos/prometheus', 'Prometheus')} and ${link('/explorador/servicos/grafana', 'Grafana')}`, 'Metrics and dashboards.'],
          [link('/explorador/servicos/common-exceptions', 'common-exceptions'), 'Internal JAR with ErrorResponse and the global advice.'],
        ],
      ),
    ),
    section(
      'fluxo',
      'Request flow',
      text('From the browser to the database, a typical call goes through the gateway, Eureka, and the business service:'),
      flow(
        [
          { label: 'HTTP client', sub: 'browser / curl', tone: 'external' },
          { label: 'API Gateway', sub: ':8222 · lb://', tone: 'platform' },
          { label: 'Eureka', sub: 'picks an instance', tone: 'platform' },
          { label: 'Microservice', sub: 'MVC + database' },
        ],
        'North-south traffic. The cart also makes east-west traffic via OpenFeign.',
      ),
      tip(
        `The live catalog of routes, bodies, responses, and errors is in the ${link('/explorador', 'System explorer')}. The sidebar topics explain the design behind it.`,
      ),
    ),
  ),

  arquitetura: page(
    'Architecture map',
    'A single view of containers, ports, and communication. Click the diagram blocks to open each service\'s profile.',
    section('diagrama', 'Diagram', architectureDiagram()),
    section(
      'leitura',
      'How to read it',
      list([
        'The top band is traffic coming in from the internet (north-south).',
        'The middle band is the Spring Cloud platform: Config, Eureka, and Gateway.',
        'The bottom band is the three microservices and the databases. The cart calls customer and product (east-west).',
        'Prometheus discovers targets in Eureka; Grafana queries Prometheus.',
      ]),
      note(
        `Replicas: product and cart do not publish a port in ${c('docker-compose.yml')}, so you can scale them with ${c('docker compose up --scale')}. Customer publishes ${c('8091')} and today stays as a single instance reachable directly.`,
      ),
    ),
  ),

  stack: page(
    'Technology stack',
    'Versions and roles of the libraries the code actually uses — inherited from parent POMs or declared in the service.',
    section(
      'runtime',
      'Language and runtime',
      table(
        ['Technology', 'Version / origin', 'Where it is used'],
        [
          ['Java', `25 (${c('java.version')} in the root POM)`, 'Every module.'],
          ['Spring Boot', `4.1.1 (parent ${c('spring-boot-starter-parent')})`, 'Every module.'],
          ['Spring Cloud', `2025.1.3 (BOM ${c('spring-cloud-dependencies')})`, 'Config, Eureka, Gateway, Feign, LoadBalancer.'],
          ['Lombok', `the Boot version (${c('lombok.version')})`, 'Root POM + annotation processor.'],
        ],
      ),
    ),
    section(
      'servicos',
      'By service type',
      table(
        ['Layer', 'Technologies'],
        [
          ['Business (customer / product / cart)', 'Spring Web MVC, Bean Validation, Config Client, Eureka Client, springdoc 3.1.1, Actuator, Micrometer Prometheus.'],
          ['Customer and Cart', 'Spring Data MongoDB.'],
          ['Product', 'Spring Data JPA, Hibernate, PostgreSQL driver (runtime).'],
          ['Cart', 'OpenFeign + Spring Cloud LoadBalancer.'],
          ['API Gateway', 'Spring Cloud Gateway WebFlux (Netty), LoadBalancer, Eureka Client, springdoc webflux-ui.'],
          ['Config Server', `spring-cloud-config-server, profile ${c('native')}.`],
          ['Discovery', 'spring-cloud-starter-netflix-eureka-server.'],
        ],
      ),
      tip(`Each service profile in the ${link('/explorador', 'Explorer')} lists Maven dependencies with scope and origin (root POM, microservices POM, or the module's own POM).`),
    ),
    section(
      'infra',
      'Infrastructure',
      list([
        `${c('eclipse-temurin:25-jdk-alpine')} in the build stage and ${c('eclipse-temurin:25-jre-alpine')} at runtime.`,
        'Official MongoDB and PostgreSQL, Prometheus and Grafana latest.',
        `Local orchestration with Docker Compose and a ${c('.env')} file at the root.`,
      ]),
    ),
  ),

  'como-executar': page(
    'How to run',
    'The official path is Docker Compose. Port, password, and database name variables live in the root .env.',
    section(
      'compose',
      'Bring everything up',
      text(`At the repository root (where ${c('docker-compose.yml')} lives):`),
      code('bash', 'docker compose --env-file .env up --build', undefined, 'Starts databases, the platform, microservices, Prometheus, and Grafana.'),
      table(
        ['URL', 'What it is'],
        [
          ['http://localhost:8222', 'API Gateway — use this for the APIs.'],
          ['http://localhost:8222/swagger-ui.html', 'Aggregated Swagger.'],
          ['http://localhost:8888/customer-microservice/default', 'YAML served by the Config Server.'],
          ['http://localhost:8761', 'Eureka dashboard.'],
          ['http://localhost:8091', 'Customer direct (the only business API with a published port).'],
          ['http://localhost:9090', 'Prometheus.'],
          ['http://localhost:3000', 'Grafana (admin / admin).'],
        ],
      ),
    ),
    section(
      'escala',
      'Replicas',
      code('bash', 'docker compose up --scale product-microservice=2 --scale cart-microservice=2'),
      text(
        `The gateway and the cart's Feign resolve ${c('lb://product-microservice')} / ${c('lb://CUSTOMER-MICROSERVICE')} through Eureka, so new instances join the rotation after they register. Do not scale customer through Compose if you still want to reach ${c('localhost:8091')} — the host port collides.`,
      ),
    ),
    section(
      'env',
      '.env file',
      text(`Compose interpolates \${...} with these values. Spring Boot does not read it automatically: what reaches the JVM are the variables in each service's ${c('environment:')} block.`),
      code('ini', ENV_FILE, '.env'),
    ),
    section(
      'local',
      'Run a module outside Docker',
      list([
        'Bring up at least config-server, discovery-server, and the service\'s database.',
        `Each local ${c('application.yml')} imports ${c('optional:configserver:http://localhost:8888')}.`,
        `Maven: ${c('mvn -pl microservices/customer-microservice -am spring-boot:run')}.`,
      ]),
      note(
        `${c('api-gateway/src/main/resources/application.yml')} put the import placeholder in ${c('server.port')} — a mistake. In Docker that is covered by ${c('SPRING_CONFIG_IMPORT')}. Details in ${link('/guias/pontos-de-atencao', 'Points of attention')}.`,
      ),
    ),
  ),
};
