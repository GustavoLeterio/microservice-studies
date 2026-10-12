import { code, list, note, page, section, table, text, tip, warn } from '../../shared/content/blocks';
import { c, ext, link } from '../../shared/content/html';
import {
  API_GATEWAY_SPRINGDOC_YML,
  LOGGING_YML,
  MANAGEMENT_YML,
  PROMETHEUS_YML,
} from '../../shared/content/snippets/config.snippets';

export const PAGES_EN = {
  actuator: page(
    'Actuator',
    'Spring Boot\'s operational library: health, info, and, in this project, the Prometheus scrape. It comes from the root POM, so every Boot module has it.',
    section(
      'config',
      'Configuration',
      text('The block repeats in the Config Server YAMLs:'),
      code('yaml', MANAGEMENT_YML),
      table(
        ['Endpoint', 'Use'],
        [
          ['/actuator/health', `Compose healthcheck (curl -f). ${c('show-details: always')} includes components (mongo, disk...).`],
          ['/actuator/info', 'Exposed, but with no extra Git/build info in this repo.'],
          ['/actuator/prometheus', 'Micrometer text format. Prometheus target.'],
        ],
      ),
      note('The gateway Actuator runs on WebFlux; the microservices\' Actuator runs on MVC. The path is the same.'),
    ),
  ),

  prometheus: page(
    'Prometheus: metrics collection',
    'Every 15s Prometheus asks Eureka who is UP and scrapes /actuator/prometheus on each instance. A new replica joins on its own.',
    section(
      'scrape',
      'Discovery via Eureka',
      code('yaml', PROMETHEUS_YML, 'prometheus.yml'),
      list([
        `${c('eureka_sd_configs')} — native service discovery, with no static host list.`,
        `Relabel ${c('application')} from the Eureka name (useful in the graphs).`,
        `The second relabel uses ${c('__meta_eureka_instance_status')} on the ${c('instance_port')} label — the label name is misleading (it is the status, not the port).`,
      ]),
      tip(`UI: ${ext('http://localhost:9090/targets', 'targets')}. Useful queries: ${c('up')}, ${c('http_server_requests_seconds_count')}.`),
    ),
    section(
      'promql',
      'PromQL examples',
      table(
        ['Question', 'Query'],
        [
          ['Instance alive?', `${c('up{job="ecommerce-microservices"}')}`],
          ['HTTP rate', `${c('rate(http_server_requests_seconds_count[1m])')}`],
          ['Heap memory', `${c('jvm_memory_used_bytes{area="heap"}')}`],
        ],
      ),
    ),
  ),

  grafana: page(
    'Grafana: dashboards',
    'Visualization layer. There is no provisioning YAML in this repo: the datasource and panels are created in the UI and stored in ./grafana.data.',
    section(
      'setup',
      'First access',
      list([
        `http://localhost:3000 — username/password from .env (${c('admin')}/${c('admin')}).`,
        `Prometheus datasource: URL ${c('http://prometheus:9090')} (Compose hostname, not localhost — Grafana runs inside the network).`,
        'Import a JVM Micrometer dashboard (id 4701 is a common starting point) or build panels with the queries from the Prometheus page.',
      ]),
      text(`The bind mount persists sqlite/dashboards across recreates. The named volume ${c('grafana-data')} declared in compose is not what the service uses.`),
    ),
  ),

  alertas: page(
    'Alerts',
    'Two possible places: native Prometheus rules (Alertmanager) and panel alerts in Grafana. Neither is provisioned in this repository.',
    section(
      'prometheus',
      'Prometheus / Alertmanager',
      text(
        `${c('alerting:')} rules in ${c('prometheus.yml')} + an Alertmanager service. Today the YAML only has scrape. To warn “service down” something like ${c('up == 0')} for 1m would be enough — it is not in the code yet.`,
      ),
    ),
    section(
      'grafana',
      'Grafana',
      text(
        'Dashboard alerts (or unified Grafana Alerting) evaluate PromQL on the same datasource. They are manual too: nothing under ./grafana/provisioning. Useful for visual thresholds (p95 latency, heap).',
      ),
      note('The point of attention is the same: metrics observability exists (scrape); alert observability is still an exercise for whoever evolves the study.'),
    ),
  ),

  logs: page(
    'Logs',
    'Spring logging (Logback underneath) with console + file. The business containers mount ./.../logs at /app/logs.',
    section(
      'config',
      'How it is configured',
      code('yaml', LOGGING_YML, 'product-microservice.yml (excerpt)'),
      list([
        'INFO level at the root; the product package at WARN.',
        'File with 10MB / 30-file rotation.',
        'Bind mount in Compose for customer, product, and cart.',
      ]),
      warn(
        `The cart YAML copies the customer logging (${c('logs/customer-microservice.log')} and logger ${c('...customer_microservice')}). In the cart container the file “lies” about the name. Fix it in the Config Server.`,
      ),
      text(`Handlers use ${c('@Slf4j')} — ${c('log.warn')} on 404 and ${c('log.error')} in the catch-all. There is no correlation id / tracing (Sleuth/Micrometer Tracing) in this code.`),
    ),
  ),

  springdoc: page(
    'Springdoc (OpenAPI)',
    'Generates /v3/api-docs from the controllers and brings up Swagger UI. On the microservices it is the webmvc-ui 3.1.1 starter, inherited from the microservices POM.',
    section(
      'mvc',
      'On the business services',
      text(
        `With the dependency on the classpath, springdoc scans ${c('@RestController')} and ${c('@RequestMapping')}. Local UI: ${c('/swagger-ui.html')} (customer publishes the port; product/cart only inside the network). JSON: ${c('/v3/api-docs')}.`,
      ),
      tip(`The ${c('@Operation')} / ${c('@Schema')} annotations are barely used: the spec comes out raw, with no rich description. The contracts commented on this site make up for that.`),
    ),
    section(
      'webflux',
      'On the gateway',
      text(
        `The gateway is not MVC. That is why its POM declares ${c('springdoc-openapi-starter-webflux-ui')}, not the webmvc starter. Without that swap the UI does not start on Netty.`,
      ),
    ),
  ),

  'swagger-no-gateway': page(
    'Swagger on the API Gateway',
    'A single Swagger UI on :8222 aggregates the three specs. The trick is the gateway exposing /v3/api-docs/{name} and springdoc.swagger-ui.urls pointing at those paths.',
    section(
      'como',
      'How it was wired',
      code('yaml', API_GATEWAY_SPRINGDOC_YML, 'api-gateway.yml (springdoc)'),
      list([
        'UI at http://localhost:8222/swagger-ui.html.',
        'Dropdown customers / products / cart.',
        `Each URL ${c('/v3/api-docs/customers')} matches the route ${c('RewritePath=/v3/api-docs/customers, /v3/api-docs')} and continues to ${c('lb://customer-microservice')}.`,
        `${c('disable-swagger-default-url')} avoids the example petstore.`,
      ]),
      text(`Flow: the browser asks the gateway for the spec (north-south); the gateway fetches ${c('/v3/api-docs')} from the service chosen by Eureka. With no instance, the UI shows a failure loading that group.`),
    ),
  ),
};
