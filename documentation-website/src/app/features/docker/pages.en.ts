import { code, list, note, page, section, table, text, warn } from '../../shared/content/blocks';
import { c, link } from '../../shared/content/html';
import {
  COMPOSE_DATABASES,
  COMPOSE_OBSERVABILITY,
  COMPOSE_VOLUMES_NETWORKS,
  CONFIG_SERVER_DOCKERFILE,
  CUSTOMER_DOCKERFILE,
  DOCKERFILE_BUILD_STAGE,
  DOCKERFILE_CACHE_SUGGESTION,
  DOCKERFILE_RUNTIME_STAGE,
  DOCKERIGNORE,
} from '../../shared/content/snippets/docker.snippets';

export const PAGES_EN = {
  'imagens-e-containers': page(
    'Images and containers',
    'An image is the immutable package (layers). A container is the process running from it. Compose declares the containers; the Dockerfile describes how to build the Java app images.',
    section(
      'usadas',
      'Images in this project',
      table(
        ['Image', 'Use'],
        [
          ['eclipse-temurin:25-jdk-alpine', 'Build stage (compiles with Maven).'],
          ['eclipse-temurin:25-jre-alpine', 'Runtime stage (only runs the JAR).'],
          ['mongo / postgres', 'Official databases, implicit latest tag.'],
          ['prom/prometheus:latest', 'Metrics collection.'],
          ['grafana/grafana:latest', 'Dashboards.'],
        ],
      ),
      text(
        `The project's own apps do not come from a registry: ${c('build: { context: ., dockerfile: ./.../Dockerfile }')} builds the image on the machine. ${c('docker compose up --build')} rebuilds when the context changes.`,
      ),
    ),
  ),

  dockerfile: page(
    'Build commands',
    'Each Dockerfile instruction creates a layer. The config-server has the most complete comments; the others copy the same pattern.',
    section(
      'instrucoes',
      'Instructions',
      table(
        ['Instruction', 'In this project'],
        [
          ['FROM', 'Twice: JDK (AS build) and JRE.'],
          ['WORKDIR /app', 'Default directory for the following commands.'],
          ['RUN apk add --no-cache maven', 'Maven does not come with Temurin. apk on Alpine.'],
          ['COPY . .', 'Sends the context (the repo root; see docker-compose build.context).'],
          ['RUN mvn ... -pl ... -am', 'Packages only the module and its Maven dependencies.'],
          ['COPY --from=build ... app.jar', 'Brings the JAR from the previous stage.'],
          ['EXPOSE', `Documents the port; it does not publish it. Compose ${c('ports:')} is what publishes.`],
          ['ENTRYPOINT ["java","-jar","app.jar"]', 'PID 1 of the container.'],
        ],
      ),
      code('dockerfile', CONFIG_SERVER_DOCKERFILE, 'config-server/Dockerfile'),
    ),
  ),

  'multi-stage': page(
    'Java image and multi-stage',
    'The JDK compiles; the JRE runs. Multi-stage leaves the final image without Maven, source, or a compiler — smaller and with less surface area.',
    section(
      'jdk-jre',
      'JDK vs JRE',
      list([
        `JDK (Java Development Kit): javac, tools; Maven needs it for ${c('package')}.`,
        `JRE (Java Runtime Environment): only the VM. Enough for ${c('java -jar')}.`,
        'Alpine: musl libc, smaller images. Official Temurin from Eclipse Adoptium.',
      ]),
      code('dockerfile', DOCKERFILE_BUILD_STAGE, undefined, 'Build stage'),
      code('dockerfile', DOCKERFILE_RUNTIME_STAGE, undefined, 'Runtime stage'),
      code('dockerfile', CUSTOMER_DOCKERFILE, 'microservices/customer-microservice/Dockerfile'),
    ),
    section(
      'cache',
      'Current limitation',
      text(
        `${c('COPY . .')} before ${c('mvn')} invalidates the cache on every source change. A design that copies only the POMs first reuses the downloaded dependencies:`,
      ),
      code('dockerfile', DOCKERFILE_CACHE_SUGGESTION, undefined, 'Suggestion — it is not applied in the current Dockerfiles.'),
    ),
  ),

  'compose-servicos': page(
    'Service configuration',
    'docker-compose.yml describes the graph: build, depends_on with healthcheck, environment, networks, and ports.',
    section(
      'padrao',
      'Pattern of a Java service',
      list([
        `${c('build.context: .')} — the Dockerfile sees the root POM (required for ${c('-am')}).`,
        `${c('depends_on: condition: service_healthy')} on config-server, discovery, and the databases.`,
        `${c('SPRING_CONFIG_IMPORT')} and ${c('EUREKA_DEFAULT_ZONE')} pointing at Compose hostnames, not localhost.`,
        `Bridge network ${c('microservices')}: internal DNS (postgres, mongodb, config-server...).`,
      ]),
      table(
        ['Service', 'Host port'],
        [
          ['api-gateway', '${GATEWAY_SERVER_PORT}:8222'],
          ['config-server', '${CONFIG_SERVER_PORT}:8888'],
          ['discovery-server', '${DISCOVERY_SERVER_PORT}:8761'],
          ['customer-microservice', '${CUSTOMER_MICROSERVICE_PORT}:8091'],
          ['product / cart', 'not published'],
        ],
      ),
      note('The config/discovery healthcheck uses curl against /actuator/health. That is why the Dockerfiles install curl on the Alpine JRE.'),
    ),
  ),

  'compose-bancos-e-volumes': page(
    'Databases and volumes',
    'A named volume survives docker compose down. A bind mount ties a host folder (logs, grafana.data).',
    section(
      'bancos',
      'Mongo and Postgres',
      code('yaml', COMPOSE_DATABASES, 'docker-compose.yml'),
      list([
        `Mongo: root user via ${c('MONGO_INITDB_*')}; the services authenticate with ${c('authSource=admin')} and choose ${c('customer_db')} / ${c('cart_db')} in the URI.`,
        `Postgres: ${c('POSTGRES_DB=product_db')} creates the database on first start. Credentials match the product datasource.`,
      ]),
    ),
    section(
      'volumes',
      'Volumes and bind mounts',
      code('yaml', COMPOSE_VOLUMES_NETWORKS, 'docker-compose.yml'),
      table(
        ['Declaration', 'Type', 'Effect'],
        [
          ['mongo: / postgres:', 'named volume', 'Database data persists.'],
          ['./microservices/.../logs:/app/logs', 'bind mount', 'Log file visible on the host.'],
          ['./prometheus.yml:/etc/prometheus/prometheus.yml', 'bind', 'Prometheus config.'],
          ['./grafana.data:/var/lib/grafana', 'bind', 'Dashboards survive a recreate.'],
        ],
      ),
      warn(
        `There is a loose ${c('config-server:')} at the end of the ${c('networks:')} block. It is invalid/dead YAML (it becomes a network key). And the ${c('grafana-data')} volume is declared, but the service uses the ${c('./grafana.data')} bind.`,
      ),
      code('yaml', COMPOSE_OBSERVABILITY, 'prometheus + grafana'),
    ),
  ),

  dockerignore: page(
    '.dockerignore',
    'The build context is the root. Without an ignore, every docker build would send target/, .git, the site\'s node_modules, logs...',
    section(
      'arquivo',
      'What is excluded',
      code('text', DOCKERIGNORE, '.dockerignore'),
      text(
        `That shrinks the context and avoids invalidating the cache for no reason. The Angular site (${c('documentation-website/')}) is already ignored, so it does not enter the Java images.`,
      ),
    ),
  ),
};
