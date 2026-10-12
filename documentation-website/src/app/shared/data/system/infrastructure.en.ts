import { PROMETHEUS_YML } from '../../content/snippets/config.snippets';
import { COMPOSE_DATABASES, COMPOSE_OBSERVABILITY } from '../../content/snippets/docker.snippets';
import { ERROR_RESPONSE, GLOBAL_EXCEPTION_HANDLER } from '../../content/snippets/java.snippets';
import { COMMON_EXCEPTIONS_POM } from '../../content/snippets/maven.snippets';
import { ServiceInfo } from '../../models/system.models';
import { FROM_MICROSERVICES_EN, FROM_ROOT_EN } from './dependencies.en';
import { json } from './examples.en';

export const COMMON_EXCEPTIONS_LIB_EN: ServiceInfo = {
  id: 'common-exceptions',
  name: 'common-exceptions',
  kind: 'biblioteca',
  tagline: 'Internal library with the error format and global exception handling.',
  description:
    'Maven module that does not run on its own: it is packaged as a plain JAR (spring-boot-maven-plugin has skip=true) and is a dependency of the three microservices. It centralizes the ErrorResponse record, used by all of them, and the GlobalExceptionHandler, inherited by the customer and product handlers.',
  responsibilities: [
    'Standardize the error body: { errors, timestamp, path }.',
    'Handle validation (400), unreadable body (400), and unexpected errors (500) in one place.',
  ],
  access: 'Not reachable over the network: it is a compile dependency.',
  image: 'No image: it is compiled together with each service (mvn -pl <service> -am).',
  technologies: ['Java 25', 'Spring Web MVC (@RestControllerAdvice)', 'Lombok (@Slf4j)'],
  dependencies: [...FROM_MICROSERVICES_EN, ...FROM_ROOT_EN],
  relations: [{ label: 'Used by', targets: ['customer-microservice', 'product-microservice', 'cart-microservice'] }],
  exceptions: [
    {
      name: 'MethodArgumentNotValidException',
      status: '400 Bad Request',
      when: '@Valid failed: each invalid field becomes an entry in the errors map.',
      handler: 'GlobalExceptionHandler.handleMethodArgumentNotValid',
    },
    {
      name: 'HttpMessageNotReadableException',
      status: '400 Bad Request',
      when: 'Missing or unreadable body → { "error": "Request body is missing" }.',
      handler: 'GlobalExceptionHandler.handleHttpMessageNotReadable',
    },
    {
      name: 'Exception',
      status: '500 Internal Server Error',
      when: 'Any other exception → { "error": "An unexpected error occurred" }.',
      handler: 'GlobalExceptionHandler.handleException',
    },
  ],
  config: [
    { language: 'java', code: ERROR_RESPONSE, file: 'common-exceptions/.../ErrorResponse.java' },
    { language: 'java', code: GLOBAL_EXCEPTION_HANDLER, file: 'common-exceptions/.../GlobalExceptionHandler.java' },
    { language: 'xml', code: COMMON_EXCEPTIONS_POM, file: 'microservices/common-exceptions/pom.xml' },
  ],
  sourceFiles: [
    {
      path: 'microservices/common-exceptions/src/main/java/com/gustavoleterio/microservices/common_exceptions/ErrorResponse.java',
      role: 'Error-body record.',
    },
    {
      path: 'microservices/common-exceptions/src/main/java/com/gustavoleterio/microservices/common_exceptions/GlobalExceptionHandler.java',
      role: 'Base handlers reused through inheritance.',
    },
  ],
  docs: [
    { label: 'Common-exceptions', path: '/codigo/common-exceptions' },
    { label: 'Exception handling', path: '/codigo/captura-de-exceptions' },
  ],
};

export const MONGODB_SERVICE_EN: ServiceInfo = {
  id: 'mongodb',
  name: 'MongoDB',
  kind: 'dados',
  tagline: 'Document database used by customer and cart (separate databases).',
  description:
    'A single instance (mongo_db container) hosts two logical databases: customer_db, for customer-microservice, and cart_db, for cart-microservice. Each service only knows its own database (database per service), even though they share the same server.',
  responsibilities: [
    'customer_db → customer collection (Customer documents).',
    'cart_db → cart collection (one document per customer, _id = customerId, embedded items).',
  ],
  port: '27017',
  access: 'localhost:27017 (published port) · user root / password pass (from .env).',
  image: 'mongo (official image, implicit latest tag)',
  technologies: ['MongoDB', 'Named volume mongo', 'Healthcheck with mongosh'],
  relations: [{ label: 'Used by', targets: ['customer-microservice', 'cart-microservice'] }],
  config: [{ language: 'yaml', code: COMPOSE_DATABASES, file: 'docker-compose.yml', caption: 'MongoDB and PostgreSQL in compose.' }],
  env: [
    { name: 'MONGO_INITDB_ROOT_USERNAME', value: 'root', purpose: 'Creates the administrator user on first startup.' },
    { name: 'MONGO_INITDB_ROOT_PASSWORD', value: 'pass', purpose: 'Administrator password.' },
  ],
  links: [],
  docs: [
    { label: 'Persistence', path: '/microservicos/persistencia' },
    { label: 'Databases and volumes in compose', path: '/docker/compose-bancos-e-volumes' },
  ],
};

export const POSTGRES_SERVICE_EN: ServiceInfo = {
  id: 'postgres',
  name: 'PostgreSQL',
  kind: 'dados',
  tagline: 'Relational database for product-microservice.',
  description:
    'postgresql_db container with the product_db database, created automatically by the POSTGRES_DB variable. Tables are generated by Hibernate (ddl-auto: update) from the Category and Product entities.',
  responsibilities: [
    'categories table (id, unique name, description).',
    'products table (id, name, description, price, stock, image_url, category_id → categories).',
    'categories_seq and products_seq sequences for the ids (@GeneratedValue).',
  ],
  port: '5432',
  access: 'localhost:5432 (published port) · user root / password pass · database product_db.',
  image: 'postgres (official image, implicit latest tag)',
  technologies: ['PostgreSQL', 'Named volume postgres', 'Healthcheck with pg_isready'],
  relations: [{ label: 'Used by', targets: ['product-microservice'] }],
  config: [{ language: 'yaml', code: COMPOSE_DATABASES, file: 'docker-compose.yml' }],
  env: [
    { name: 'POSTGRES_USER', value: 'root', purpose: 'Superuser created at startup.' },
    { name: 'POSTGRES_PASSWORD', value: 'pass', purpose: 'Superuser password.' },
    { name: 'POSTGRES_DB', value: 'product_db', purpose: 'Database created automatically.' },
  ],
  docs: [
    { label: 'Persistence', path: '/microservicos/persistencia' },
    { label: 'Databases and volumes in compose', path: '/docker/compose-bancos-e-volumes' },
  ],
};

export const PROMETHEUS_SERVICE_EN: ServiceInfo = {
  id: 'prometheus',
  name: 'Prometheus',
  kind: 'observabilidade',
  tagline: 'Collects and stores metrics from every service registered in Eureka.',
  description:
    'Every 15 seconds it queries Eureka to discover instances (eureka_sd_configs) and scrapes /actuator/prometheus on each one. New replicas join monitoring automatically, without editing prometheus.yml.',
  responsibilities: [
    'Discover targets through Eureka.',
    'Collect JVM, HTTP, connection-pool, and similar metrics via Micrometer.',
    'Serve PromQL for queries and for Grafana.',
  ],
  port: '9090',
  access: 'http://localhost:9090 (published port).',
  image: 'prom/prometheus:latest',
  technologies: ['Prometheus', 'PromQL', 'Eureka service discovery'],
  relations: [
    { label: 'Collects from', targets: ['api-gateway', 'customer-microservice', 'product-microservice', 'cart-microservice'] },
    { label: 'Discovers targets in', targets: ['discovery-server'] },
    { label: 'Queried by', targets: ['grafana'] },
  ],
  endpointGroups: [
    {
      title: 'Prometheus HTTP API',
      basePath: '/api/v1',
      endpoints: [
        {
          id: 'prometheus-query',
          method: 'GET',
          path: '/api/v1/query?query=up',
          summary: 'Runs an instant PromQL query.',
          handler: 'Prometheus',
          params: [{ name: 'query', in: 'query', type: 'PromQL', description: 'For example, up, http_server_requests_seconds_count.' }],
          responses: [
            {
              status: 200,
              description: 'Query result (abbreviated).',
              contentType: 'application/json',
              example: json({
                status: 'success',
                data: {
                  resultType: 'vector',
                  result: [
                    {
                      metric: { __name__: 'up', application: 'CART-MICROSERVICE', instance: '172.18.0.11:8093', job: 'ecommerce-microservices' },
                      value: [1791470000.0, '1'],
                    },
                  ],
                },
              }),
            },
          ],
          errors: [{ status: 400, cause: 'Invalid PromQL expression.', source: 'Prometheus' }],
        },
      ],
    },
  ],
  config: [
    { language: 'yaml', code: PROMETHEUS_YML, file: 'prometheus.yml' },
    { language: 'yaml', code: COMPOSE_OBSERVABILITY, file: 'docker-compose.yml' },
  ],
  links: [
    { label: 'Prometheus UI', url: 'http://localhost:9090' },
    { label: 'Targets', url: 'http://localhost:9090/targets' },
    { label: 'up query', url: 'http://localhost:9090/api/v1/query?query=up' },
  ],
  docs: [
    { label: 'Metrics collection', path: '/observabilidade/prometheus' },
    { label: 'Alerts', path: '/observabilidade/alertas' },
  ],
};

export const GRAFANA_SERVICE_EN: ServiceInfo = {
  id: 'grafana',
  name: 'Grafana',
  kind: 'observabilidade',
  tagline: 'Dashboards and visual alerts over Prometheus metrics.',
  description:
    'Visualization UI. The project has no automatic provisioning: the Prometheus datasource (http://prometheus:9090) and the dashboards are created in the UI and persisted in the ./grafana.data folder (bind mount).',
  responsibilities: ['Visualize metrics in dashboards.', 'Fire alerts from PromQL queries.'],
  port: '3000',
  access: 'http://localhost:3000 · login admin / admin (from .env).',
  image: 'grafana/grafana:latest',
  technologies: ['Grafana', 'Prometheus datasource', 'Bind mount ./grafana.data'],
  relations: [{ label: 'Queries', targets: ['prometheus'] }],
  config: [{ language: 'yaml', code: COMPOSE_OBSERVABILITY, file: 'docker-compose.yml' }],
  env: [
    { name: 'GF_SECURITY_ADMIN_USER', value: 'admin', purpose: 'Initial administrator user.' },
    { name: 'GF_SECURITY_ADMIN_PASSWORD', value: 'admin', purpose: 'Initial administrator password.' },
  ],
  links: [{ label: 'Grafana', url: 'http://localhost:3000' }],
  docs: [
    { label: 'Grafana: dashboards', path: '/observabilidade/grafana' },
    { label: 'Alerts', path: '/observabilidade/alertas' },
  ],
};
