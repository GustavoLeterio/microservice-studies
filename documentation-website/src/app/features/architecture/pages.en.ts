import { code, flow, list, note, page, section, table, text, tip, warn } from '../../shared/content/blocks';
import { c, link } from '../../shared/content/html';
import {
  API_GATEWAY_APPLICATION_YML,
  API_GATEWAY_CONFIG_YML,
  API_GATEWAY_ROUTES_YML,
  CONFIG_SERVER_APPLICATION_YML,
  CUSTOMER_APPLICATION_YML,
  CUSTOMER_CONFIG_YML,
  DISCOVERY_CONFIG_YML,
} from '../../shared/content/snippets/config.snippets';
import { API_GATEWAY_APPLICATION, CONFIG_SERVER_APPLICATION, DISCOVERY_SERVER_APPLICATION } from '../../shared/content/snippets/java.snippets';

export const PAGES_EN = {
  'config-server': page(
    'Centralized configuration',
    'Spring Cloud Config Server with the native profile: the YAMLs live inside the JAR itself, under classpath:/config, one file per spring.application.name.',
    section(
      'o-que-e',
      'What it is',
      text(
        `Without a Config Server, each service would load a huge ${c('application.yml')} (port, mongo, eureka, logs, actuator...). Here the local YAML only states the app name and where to import from. The rest lives in the config-server, so changing a port or log level does not require rebuilding every service — only the config-server (in this native setup; a Git backend would not even require that).`,
      ),
      code('java', CONFIG_SERVER_APPLICATION, 'ConfigServerApplication.java'),
      code('yaml', CONFIG_SERVER_APPLICATION_YML, 'config-server/src/main/resources/application.yml'),
    ),
    section(
      'arquivos',
      'One YAML per service',
      table(
        ['File under classpath:/config', 'Client'],
        [
          ['api-gateway.yml', 'api-gateway'],
          ['discovery-server.yml', 'discovery-server'],
          ['customer-microservice.yml', 'customer'],
          ['product-microservice.yml', 'product'],
          ['cart-microservice.yml', 'cart'],
        ],
      ),
      code('yaml', CUSTOMER_CONFIG_YML, 'config-server/src/main/resources/config/customer-microservice.yml'),
      tip(`GET ${c('http://localhost:8888/customer-microservice/default')} returns the property sources. Placeholders ${c('${...}')} are still unresolved — the client is the one that resolves them.`),
    ),
  ),

  'import-de-properties': page(
    'Property import',
    'spring.config.import pulls a remote Environment at startup. It is the hook between the service and the Config Server.',
    section(
      'local',
      'Minimal local YAML',
      code('yaml', CUSTOMER_APPLICATION_YML, 'customer-microservice/src/main/resources/application.yml'),
      list([
        `${c('optional:')} — if the Config Server is down, the app still starts (useful in the IDE). In Docker, Compose forces ${c('SPRING_CONFIG_IMPORT=configserver:http://config-server:8888')} without optional.`,
        `The name ${c('spring.application.name')} selects the ${c('{name}.yml')} file on the server.`,
        'Precedence: container env vars > imported YAML > local YAML. That is why the Mongo URI and the Eureka zone come from Compose.',
      ]),
      warn(
        `In api-gateway the import ended up in ${c('server.port')}. Boot still starts in Docker because ${c('SPRING_CONFIG_IMPORT')} (relaxed binding) sets the real import. Outside Compose the gateway breaks.`,
      ),
      code('yaml', API_GATEWAY_APPLICATION_YML, 'api-gateway/src/main/resources/application.yml'),
    ),
  ),

  eureka: page(
    'Eureka (service discovery)',
    'A live catalog of instances. Whoever starts registers; whoever calls asks by name instead of a fixed IP.',
    section(
      'servidor',
      'Server',
      code('java', DISCOVERY_SERVER_APPLICATION, 'DiscoveryServerApplication.java'),
      code('yaml', DISCOVERY_CONFIG_YML, 'discovery-server.yml', 'registerWithEureka/fetchRegistry false: the server does not try to register with itself.'),
      text('Dashboard: http://localhost:8761. API: GET /eureka/apps (XML by default; JSON with Accept).'),
    ),
    section(
      'clientes',
      'Clients',
      text(
        `Everyone except the config-server declares ${c('spring-cloud-starter-netflix-eureka-client')} and points ${c('eureka.client.service-url.defaultZone')}. Heartbeats keep the status UP; a dead instance disappears after the timeout. Prometheus also reads the registry (${c('eureka_sd_configs')}).`,
      ),
      note(
        `The discovery YAML has a historical typo: ${c('EUREKA_CLIENT_SERVICERUL_DEFAULTZONE')} (missing the L in URL). Because ${c('registerWithEureka')} is false, the placeholder is barely used.`,
      ),
    ),
  ),

  'api-gateway': page(
    'API Gateway',
    'Spring Cloud Gateway (WebFlux/Netty): the only port published to the outside world. It matches the path, rewrites it when needed, and forwards to lb://name-in-eureka.',
    section(
      'rotas',
      'Routes',
      text(
        `Everything is in configuration, not in Java. The main class is empty. Predicates ${c('Path=')} choose the route; ${c('uri: lb://...')} asks the LoadBalancer; ${c('RewritePath')} only acts on the OpenAPI URLs.`,
      ),
      code('java', API_GATEWAY_APPLICATION, 'ApiGatewayApplication.java'),
      code('yaml', API_GATEWAY_ROUTES_YML, 'api-gateway.yml (routes)'),
      table(
        ['Inbound path', 'Destination'],
        [
          ['/api/v1/customers/**', 'lb://customer-microservice'],
          ['/api/v1/products/** and /api/v1/categories/**', 'lb://product-microservice'],
          ['/api/v1/carts/**', 'lb://cart-microservice'],
          ['/v3/api-docs/customers|products|cart', 'same service, path rewritten to /v3/api-docs'],
        ],
      ),
    ),
    section(
      'erros',
      'Errors at the gateway',
      list([
        'Path with no route → WebFlux 404.',
        'Service with no instance in Eureka → 503 (Unable to find instance).',
        '4xx/5xx from the service → passed through as they arrived.',
      ]),
      code('yaml', API_GATEWAY_CONFIG_YML, 'config-server/.../api-gateway.yml', 'DEBUG logs help you see the route match.'),
    ),
  ),

  'load-balancer': page(
    'Server-side and client-side',
    'Load balancing means choosing one instance among several. In this project both sides use Spring Cloud LoadBalancer + Eureka — there is no nginx and no legacy Ribbon.',
    section(
      'client-side',
      'Client-side',
      text(
        `The caller knows the cluster. The cart (Feign) and the gateway (${c('lb://')}) ask Eureka and choose (round-robin). Benefit: no extra hop. Cost: every caller needs the library and a registry.`,
      ),
      list([
        `Gateway → microservices: ${c('spring-cloud-starter-loadbalancer')} in the gateway POM.`,
        'Cart → customer/product: the same library in the cart POM.',
      ]),
    ),
    section(
      'server-side',
      'Server-side',
      text(
        `A proxy in front chooses the backend and the client only knows the proxy. The API Gateway <em>is</em> that proxy for external traffic: the browser only talks to :8222. Between the microservices themselves there is no server-side load balancer — the cart does not go through the gateway to call product.`,
      ),
      tip(`To see the rotation: ${c('docker compose up --scale product-microservice=2')} and watch instanceId in Eureka and in the logs.`),
    ),
  ),

  trafego: page(
    'North-south and east-west traffic',
    'North-south is external client → system. East-west is service → service, inside the network.',
    section(
      'ns',
      'North-south',
      flow(
        [
          { label: 'Internet', tone: 'external' },
          { label: 'API Gateway :8222', tone: 'platform' },
          { label: 'Microservice' },
          { label: 'Database', tone: 'data' },
        ],
        'Traffic enters only through 8222. Databases and internal ports do not need to be exposed (and product/cart should not be).',
      ),
    ),
    section(
      'ew',
      'East-west',
      flow(
        [
          { label: 'cart', sub: 'Feign' },
          { label: 'customer / product' },
        ],
        'Docker network microservices. The gateway does not see this call.',
      ),
      text(
        `Design implication: latency and partial failure. If product goes down, the cart GET can still work (it only reads Mongo), but adding an item fails in Feign. There is no circuit breaker in this code — only the exception.`,
      ),
    ),
  ),
};
