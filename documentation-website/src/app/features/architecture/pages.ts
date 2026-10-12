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

export const PAGES = {
  'config-server': page(
    'Centralização de configurações',
    'Spring Cloud Config Server no perfil native: os YAMLs moram no próprio JAR, em classpath:/config, um arquivo por spring.application.name.',
    section(
      'o-que-e',
      'O que é',
      text(
        `Sem Config Server, cada serviço carregaria um ${c('application.yml')} enorme (porta, mongo, eureka, logs, actuator...). Aqui o YAML local só diz o nome da app e de onde importar. O restante vive no config-server, então mudar porta ou log level não exige rebuild de todos os serviços — só do config-server (neste setup native; um backend Git permitiria nem isso).`,
      ),
      code('java', CONFIG_SERVER_APPLICATION, 'ConfigServerApplication.java'),
      code('yaml', CONFIG_SERVER_APPLICATION_YML, 'config-server/src/main/resources/application.yml'),
    ),
    section(
      'arquivos',
      'Um YAML por serviço',
      table(
        ['Arquivo em classpath:/config', 'Cliente'],
        [
          ['api-gateway.yml', 'api-gateway'],
          ['discovery-server.yml', 'discovery-server'],
          ['customer-microservice.yml', 'customer'],
          ['product-microservice.yml', 'product'],
          ['cart-microservice.yml', 'cart'],
        ],
      ),
      code('yaml', CUSTOMER_CONFIG_YML, 'config-server/src/main/resources/config/customer-microservice.yml'),
      tip(`GET ${c('http://localhost:8888/customer-microservice/default')} devolve as property sources. Placeholders ${c('${...}')} ainda não resolvidos — quem resolve é o cliente.`),
    ),
  ),

  'import-de-properties': page(
    'Import de properties',
    'spring.config.import puxa um Environment remoto na subida. É o gancho entre o serviço e o Config Server.',
    section(
      'local',
      'YAML local mínimo',
      code('yaml', CUSTOMER_APPLICATION_YML, 'customer-microservice/src/main/resources/application.yml'),
      list([
        `${c('optional:')} — se o Config Server estiver fora, a app ainda sobe (útil no IDE). No Docker o Compose força ${c('SPRING_CONFIG_IMPORT=configserver:http://config-server:8888')} sem optional.`,
        `O nome ${c('spring.application.name')} escolhe o arquivo ${c('{name}.yml')} no servidor.`,
        'Precedência: env vars do container > YAML importado > YAML local. Por isso URI do Mongo e zona do Eureka vêm do Compose.',
      ]),
      warn(
        `No api-gateway o import foi parar em ${c('server.port')}. O Boot ainda sobe no Docker porque ${c('SPRING_CONFIG_IMPORT')} (relaxed binding) define o import de verdade. Fora do Compose o gateway quebra.`,
      ),
      code('yaml', API_GATEWAY_APPLICATION_YML, 'api-gateway/src/main/resources/application.yml'),
    ),
  ),

  eureka: page(
    'Eureka (service discovery)',
    'Catálogo vivo de instâncias. Quem sobe se registra; quem chama pergunta pelo nome em vez de IP fixo.',
    section(
      'servidor',
      'Servidor',
      code('java', DISCOVERY_SERVER_APPLICATION, 'DiscoveryServerApplication.java'),
      code('yaml', DISCOVERY_CONFIG_YML, 'discovery-server.yml', 'registerWithEureka/fetchRegistry false: o server não tenta se registrar nele mesmo.'),
      text('Painel: http://localhost:8761. API: GET /eureka/apps (XML por padrão; JSON com Accept).'),
    ),
    section(
      'clientes',
      'Clientes',
      text(
        `Todo mundo que não é o config-server declara ${c('spring-cloud-starter-netflix-eureka-client')} e aponta ${c('eureka.client.service-url.defaultZone')}. Heartbeats mantêm o status UP; instância morta some depois do timeout. O Prometheus também lê o registro (${c('eureka_sd_configs')}).`,
      ),
      note(
        `No YAML do discovery há um typo histórico: ${c('EUREKA_CLIENT_SERVICERUL_DEFAULTZONE')} (falta a L de URL). Como ${c('registerWithEureka')} é false, o placeholder quase não é usado.`,
      ),
    ),
  ),

  'api-gateway': page(
    'API Gateway',
    'Spring Cloud Gateway (WebFlux/Netty): única porta publicada para o mundo. Casa o path, reescreve se preciso e encaminha para lb://nome-no-eureka.',
    section(
      'rotas',
      'Rotas',
      text(
        `Tudo está em configuração, não em Java. A classe main está vazia. Predicates ${c('Path=')} escolhem a rota; ${c('uri: lb://...')} pede o LoadBalancer; ${c('RewritePath')} só atua nas URLs do OpenAPI.`,
      ),
      code('java', API_GATEWAY_APPLICATION, 'ApiGatewayApplication.java'),
      code('yaml', API_GATEWAY_ROUTES_YML, 'api-gateway.yml (rotas)'),
      table(
        ['Path de entrada', 'Destino'],
        [
          ['/api/v1/customers/**', 'lb://customer-microservice'],
          ['/api/v1/products/** e /api/v1/categories/**', 'lb://product-microservice'],
          ['/api/v1/carts/**', 'lb://cart-microservice'],
          ['/v3/api-docs/customers|products|cart', 'mesmo serviço, path reescrito para /v3/api-docs'],
        ],
      ),
    ),
    section(
      'erros',
      'Erros no gateway',
      list([
        'Path sem rota → 404 do WebFlux.',
        'Serviço sem instância no Eureka → 503 (Unable to find instance).',
        '4xx/5xx do serviço → repassados como vieram.',
      ]),
      code('yaml', API_GATEWAY_CONFIG_YML, 'config-server/.../api-gateway.yml', 'Logs em DEBUG ajudam a ver o match da rota.'),
    ),
  ),

  'load-balancer': page(
    'Server-side e client-side',
    'Balanceamento é escolher uma instância entre várias. Neste projeto os dois lados usam Spring Cloud LoadBalancer + Eureka — não há nginx nem ribbon legado.',
    section(
      'client-side',
      'Client-side',
      text(
        `Quem chama conhece o cluster. O cart (Feign) e o gateway (${c('lb://')}) perguntam ao Eureka e escolhem (round-robin). Vantagem: sem hop extra. Custo: cada chamador precisa da lib e de um registro.`,
      ),
      list([
        `Gateway → microserviços: ${c('spring-cloud-starter-loadbalancer')} no POM do gateway.`,
        'Cart → customer/product: a mesma lib no POM do cart.',
      ]),
    ),
    section(
      'server-side',
      'Server-side',
      text(
        `Um proxy na frente escolhe o backend e o cliente só conhece o proxy. O API Gateway <em>é</em> esse proxy para o tráfego externo: o browser só fala com :8222. Entre os próprios microserviços não há um load balancer server-side — o cart não passa pelo gateway para chamar o product.`,
      ),
      tip(`Para ver o rodízio: ${c('docker compose up --scale product-microservice=2')} e observe instanceId no Eureka e nos logs.`),
    ),
  ),

  trafego: page(
    'Tráfego norte-sul e leste-oeste',
    'Norte-sul é cliente externo → sistema. Leste-oeste é serviço → serviço, dentro da rede.',
    section(
      'ns',
      'Norte-sul',
      flow(
        [
          { label: 'Internet', tone: 'external' },
          { label: 'API Gateway :8222', tone: 'platform' },
          { label: 'Microserviço' },
          { label: 'Banco', tone: 'data' },
        ],
        'Entra só pela 8222. Bancos e portas internas não precisam (e product/cart não devem) ficar expostos.',
      ),
    ),
    section(
      'ew',
      'Leste-oeste',
      flow(
        [
          { label: 'cart', sub: 'Feign' },
          { label: 'customer / product' },
        ],
        'Rede Docker microservices. O gateway não vê essa chamada.',
      ),
      text(
        `Implicação de desenho: latência e falha parciais. Se o product cair, o GET do cart ainda pode funcionar (só lê Mongo), mas adicionar item falha no Feign. Não há circuit breaker neste código — só a exceção.`,
      ),
    ),
  ),
};
