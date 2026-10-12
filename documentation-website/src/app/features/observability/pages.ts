import { code, list, note, page, section, table, text, tip, warn } from '../../shared/content/blocks';
import { c, ext, link } from '../../shared/content/html';
import {
  API_GATEWAY_SPRINGDOC_YML,
  LOGGING_YML,
  MANAGEMENT_YML,
  PROMETHEUS_YML,
} from '../../shared/content/snippets/config.snippets';

export const PAGES = {
  actuator: page(
    'Actuator',
    'Biblioteca operacional do Spring Boot: health, info e, neste projeto, o scrape Prometheus. Vem do POM raiz, então todos os módulos Boot a têm.',
    section(
      'config',
      'Configuração',
      text('O bloco se repete nos YAMLs do Config Server:'),
      code('yaml', MANAGEMENT_YML),
      table(
        ['Endpoint', 'Uso'],
        [
          ['/actuator/health', `Healthcheck do Compose (curl -f). ${c('show-details: always')} inclui componentes (mongo, disco...).`],
          ['/actuator/info', 'Exposto, mas sem Git/build info extra neste repo.'],
          ['/actuator/prometheus', 'Formato texto Micrometer. Alvo do Prometheus.'],
        ],
      ),
      note('O Actuator do gateway roda em WebFlux; o dos microserviços, em MVC. O path é o mesmo.'),
    ),
  ),

  prometheus: page(
    'Prometheus: coleta de métricas',
    'A cada 15s o Prometheus pergunta ao Eureka quem está UP e faz scrape de /actuator/prometheus em cada instância. Réplica nova entra sozinha.',
    section(
      'scrape',
      'Descoberta via Eureka',
      code('yaml', PROMETHEUS_YML, 'prometheus.yml'),
      list([
        `${c('eureka_sd_configs')} — service discovery nativo, sem lista estática de hosts.`,
        `Relabel ${c('application')} a partir do nome Eureka (útil nos gráficos).`,
        `O segundo relabel usa ${c('__meta_eureka_instance_status')} no label ${c('instance_port')} — o nome do label é enganoso (é o status, não a porta).`,
      ]),
      tip(`UI: ${ext('http://localhost:9090/targets', 'targets')}. Consulta útil: ${c('up')}, ${c('http_server_requests_seconds_count')}.`),
    ),
    section(
      'promql',
      'Exemplos PromQL',
      table(
        ['Pergunta', 'Query'],
        [
          ['Instância viva?', `${c('up{job="ecommerce-microservices"}')}`],
          ['Taxa de HTTP', `${c('rate(http_server_requests_seconds_count[1m])')}`],
          ['Memória heap', `${c('jvm_memory_used_bytes{area="heap"}')}`],
        ],
      ),
    ),
  ),

  grafana: page(
    'Grafana: dashboards',
    'Camada de visualização. Não há provisioning YAML neste repo: datasource e painéis nascem na UI e ficam em ./grafana.data.',
    section(
      'setup',
      'Primeiro acesso',
      list([
        `http://localhost:3000 — usuário/senha do .env (${c('admin')}/${c('admin')}).`,
        `Datasource Prometheus: URL ${c('http://prometheus:9090')} (hostname Compose, não localhost — o Grafana roda dentro da rede).`,
        'Importe um dashboard JVM Micrometer (id 4701 é um ponto de partida comum) ou monte painéis com as queries da página do Prometheus.',
      ]),
      text(`O bind mount persiste sqlite/dashboards entre recreates. O volume nomeado ${c('grafana-data')} declarado no compose não é o que o serviço usa.`),
    ),
  ),

  alertas: page(
    'Alertas',
    'Dois lugares possíveis: regras nativas do Prometheus (Alertmanager) e alertas de painel no Grafana. Nenhum dos dois está provisionado neste repositório.',
    section(
      'prometheus',
      'Prometheus / Alertmanager',
      text(
        `Regras ${c('alerting:')} no ${c('prometheus.yml')} + um serviço Alertmanager. Hoje o YAML só tem scrape. Para avisar “serviço down” bastaria algo como ${c('up == 0')} por 1m — ainda não está no código.`,
      ),
    ),
    section(
      'grafana',
      'Grafana',
      text(
        'Alertas de dashboard (ou Grafana Alerting unificado) avaliam PromQL no mesmo datasource. Também são manuais: nada em ./grafana/provisioning. Útil para limiares visuais (latência p95, heap).',
      ),
      note('O ponto de atenção é o mesmo: observabilidade de métricas existe (scrape); observabilidade de alerta ainda é exercício para quem for evoluir o estudo.'),
    ),
  ),

  logs: page(
    'Logs',
    'Logging do Spring (Logback por baixo) com console + arquivo. Os containers de negócio montam ./.../logs em /app/logs.',
    section(
      'config',
      'Como está configurado',
      code('yaml', LOGGING_YML, 'product-microservice.yml (trecho)'),
      list([
        'Nível INFO na raiz; o pacote do product em WARN.',
        'Arquivo com rotação 10MB / 30 arquivos.',
        'Bind mount no Compose para customer, product e cart.',
      ]),
      warn(
        `O YAML do cart copia o logging do customer (${c('logs/customer-microservice.log')} e logger ${c('...customer_microservice')}). No container do cart o arquivo “mente” o nome. Corrigir no Config Server.`,
      ),
      text(`Os handlers usam ${c('@Slf4j')} — ${c('log.warn')} em 404 e ${c('log.error')} no catch-all. Não há correlation id / tracing (Sleuth/Micrometer Tracing) neste código.`),
    ),
  ),

  springdoc: page(
    'Springdoc (OpenAPI)',
    'Gera /v3/api-docs a partir dos controllers e sobe o Swagger UI. Nos microserviços é a starter webmvc-ui 3.1.1, herdada do POM microservices.',
    section(
      'mvc',
      'Nos serviços de negócio',
      text(
        `Com a dependência no classpath, springdoc varre ${c('@RestController')} e ${c('@RequestMapping')}. UI local: ${c('/swagger-ui.html')} (customer publica a porta; product/cart só dentro da rede). JSON: ${c('/v3/api-docs')}.`,
      ),
      tip(`Anotações ${c('@Operation')} / ${c('@Schema')} quase não são usadas: a spec sai crua, sem descrição rica. Os contratos comentados neste site compensam isso.`),
    ),
    section(
      'webflux',
      'No gateway',
      text(
        `O gateway não é MVC. Por isso o POM dele declara ${c('springdoc-openapi-starter-webflux-ui')}, não a starter webmvc. Sem essa troca a UI não sobe no Netty.`,
      ),
    ),
  ),

  'swagger-no-gateway': page(
    'Swagger no API Gateway',
    'Um único Swagger UI em :8222 agrega as três specs. O truque é o gateway expor /v3/api-docs/{nome} e o springdoc.swagger-ui.urls apontar para esses paths.',
    section(
      'como',
      'Como foi ligado',
      code('yaml', API_GATEWAY_SPRINGDOC_YML, 'api-gateway.yml (springdoc)'),
      list([
        'UI em http://localhost:8222/swagger-ui.html.',
        'Dropdown customers / products / cart.',
        `Cada URL ${c('/v3/api-docs/customers')} casa com a rota ${c('RewritePath=/v3/api-docs/customers, /v3/api-docs')} e segue para ${c('lb://customer-microservice')}.`,
        `${c('disable-swagger-default-url')} evita o petstore de exemplo.`,
      ]),
      text(`Fluxo: o browser pede a spec ao gateway (norte-sul); o gateway busca ${c('/v3/api-docs')} no serviço escolhido pelo Eureka. Sem instância, a UI mostra falha ao carregar aquele grupo.`),
    ),
  ),
};
