import { PROMETHEUS_YML } from '../../content/snippets/config.snippets';
import { COMPOSE_DATABASES, COMPOSE_OBSERVABILITY } from '../../content/snippets/docker.snippets';
import { ERROR_RESPONSE, GLOBAL_EXCEPTION_HANDLER } from '../../content/snippets/java.snippets';
import { COMMON_EXCEPTIONS_POM } from '../../content/snippets/maven.snippets';
import { ServiceInfo } from '../../models/system.models';
import { FROM_MICROSERVICES, FROM_ROOT } from './dependencies.data';
import { json } from './examples';

export const COMMON_EXCEPTIONS_LIB: ServiceInfo = {
  id: 'common-exceptions',
  name: 'common-exceptions',
  kind: 'biblioteca',
  tagline: 'Biblioteca interna com o formato de erro e o tratamento global de exceções.',
  description:
    'Módulo Maven que não roda sozinho: é empacotado como JAR comum (o spring-boot-maven-plugin está com skip=true) e entra como dependência nos três microserviços. Centraliza o record ErrorResponse, usado por todos, e o GlobalExceptionHandler, herdado pelos handlers do customer e do product.',
  responsibilities: [
    'Padronizar o corpo de erro: { errors, timestamp, path }.',
    'Tratar validação (400), corpo ilegível (400) e erros inesperados (500) de forma única.',
  ],
  access: 'Não é acessível por rede: é uma dependência de compilação.',
  image: 'Não possui imagem: é compilado junto com cada serviço (mvn -pl <serviço> -am).',
  technologies: ['Java 25', 'Spring Web MVC (@RestControllerAdvice)', 'Lombok (@Slf4j)'],
  dependencies: [...FROM_MICROSERVICES, ...FROM_ROOT],
  relations: [{ label: 'Usada por', targets: ['customer-microservice', 'product-microservice', 'cart-microservice'] }],
  exceptions: [
    {
      name: 'MethodArgumentNotValidException',
      status: '400 Bad Request',
      when: '@Valid falhou: cada campo inválido vira uma entrada no mapa errors.',
      handler: 'GlobalExceptionHandler.handleMethodArgumentNotValid',
    },
    {
      name: 'HttpMessageNotReadableException',
      status: '400 Bad Request',
      when: 'Corpo ausente ou ilegível → { "error": "Request body is missing" }.',
      handler: 'GlobalExceptionHandler.handleHttpMessageNotReadable',
    },
    {
      name: 'Exception',
      status: '500 Internal Server Error',
      when: 'Qualquer outra exceção → { "error": "An unexpected error occurred" }.',
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
      role: 'Record do corpo de erro.',
    },
    {
      path: 'microservices/common-exceptions/src/main/java/com/gustavoleterio/microservices/common_exceptions/GlobalExceptionHandler.java',
      role: 'Handlers base reutilizados por herança.',
    },
  ],
  docs: [
    { label: 'Common-exceptions', path: '/codigo/common-exceptions' },
    { label: 'Captura de exceptions', path: '/codigo/captura-de-exceptions' },
  ],
};

export const MONGODB_SERVICE: ServiceInfo = {
  id: 'mongodb',
  name: 'MongoDB',
  kind: 'dados',
  tagline: 'Banco de documentos usado pelo customer e pelo cart (bancos separados).',
  description:
    'Uma única instância (container mongo_db) hospeda dois bancos lógicos: customer_db, do customer-microservice, e cart_db, do cart-microservice. Cada serviço só conhece o próprio banco (database per service), embora compartilhem o mesmo servidor.',
  responsibilities: [
    'customer_db → coleção customer (documentos Customer).',
    'cart_db → coleção cart (um documento por cliente, _id = customerId, itens embutidos).',
  ],
  port: '27017',
  access: 'localhost:27017 (porta publicada) · usuário root / senha pass (do .env).',
  image: 'mongo (imagem oficial, tag latest implícita)',
  technologies: ['MongoDB', 'Volume nomeado mongo', 'Healthcheck com mongosh'],
  relations: [{ label: 'Usado por', targets: ['customer-microservice', 'cart-microservice'] }],
  config: [{ language: 'yaml', code: COMPOSE_DATABASES, file: 'docker-compose.yml', caption: 'MongoDB e PostgreSQL no compose.' }],
  env: [
    { name: 'MONGO_INITDB_ROOT_USERNAME', value: 'root', purpose: 'Cria o usuário administrador na primeira inicialização.' },
    { name: 'MONGO_INITDB_ROOT_PASSWORD', value: 'pass', purpose: 'Senha do administrador.' },
  ],
  links: [],
  docs: [
    { label: 'Persistência', path: '/microservicos/persistencia' },
    { label: 'Bancos e volumes no compose', path: '/docker/compose-bancos-e-volumes' },
  ],
};

export const POSTGRES_SERVICE: ServiceInfo = {
  id: 'postgres',
  name: 'PostgreSQL',
  kind: 'dados',
  tagline: 'Banco relacional do product-microservice.',
  description:
    'Container postgresql_db com o banco product_db, criado automaticamente pela variável POSTGRES_DB. As tabelas são geradas pelo Hibernate (ddl-auto: update) a partir das entidades Category e Product.',
  responsibilities: [
    'Tabela categories (id, name único, description).',
    'Tabela products (id, name, description, price, stock, image_url, category_id → categories).',
    'Sequences categories_seq e products_seq para os ids (@GeneratedValue).',
  ],
  port: '5432',
  access: 'localhost:5432 (porta publicada) · usuário root / senha pass · banco product_db.',
  image: 'postgres (imagem oficial, tag latest implícita)',
  technologies: ['PostgreSQL', 'Volume nomeado postgres', 'Healthcheck com pg_isready'],
  relations: [{ label: 'Usado por', targets: ['product-microservice'] }],
  config: [{ language: 'yaml', code: COMPOSE_DATABASES, file: 'docker-compose.yml' }],
  env: [
    { name: 'POSTGRES_USER', value: 'root', purpose: 'Superusuário criado na inicialização.' },
    { name: 'POSTGRES_PASSWORD', value: 'pass', purpose: 'Senha do superusuário.' },
    { name: 'POSTGRES_DB', value: 'product_db', purpose: 'Banco criado automaticamente.' },
  ],
  docs: [
    { label: 'Persistência', path: '/microservicos/persistencia' },
    { label: 'Bancos e volumes no compose', path: '/docker/compose-bancos-e-volumes' },
  ],
};

export const PROMETHEUS_SERVICE: ServiceInfo = {
  id: 'prometheus',
  name: 'Prometheus',
  kind: 'observabilidade',
  tagline: 'Coleta e armazena as métricas de todos os serviços registrados no Eureka.',
  description:
    'A cada 15 segundos consulta o Eureka para descobrir as instâncias (eureka_sd_configs) e faz scrape de /actuator/prometheus em cada uma. Réplicas novas entram no monitoramento automaticamente, sem editar o prometheus.yml.',
  responsibilities: [
    'Descobrir alvos pelo Eureka.',
    'Coletar métricas de JVM, HTTP, pools de conexão etc. via Micrometer.',
    'Servir PromQL para consultas e para o Grafana.',
  ],
  port: '9090',
  access: 'http://localhost:9090 (porta publicada).',
  image: 'prom/prometheus:latest',
  technologies: ['Prometheus', 'PromQL', 'Eureka service discovery'],
  relations: [
    { label: 'Coleta de', targets: ['api-gateway', 'customer-microservice', 'product-microservice', 'cart-microservice'] },
    { label: 'Descobre alvos em', targets: ['discovery-server'] },
    { label: 'Consultado por', targets: ['grafana'] },
  ],
  endpointGroups: [
    {
      title: 'API HTTP do Prometheus',
      basePath: '/api/v1',
      endpoints: [
        {
          id: 'prometheus-query',
          method: 'GET',
          path: '/api/v1/query?query=up',
          summary: 'Executa uma consulta PromQL instantânea.',
          handler: 'Prometheus',
          params: [{ name: 'query', in: 'query', type: 'PromQL', description: 'Ex.: up, http_server_requests_seconds_count.' }],
          responses: [
            {
              status: 200,
              description: 'Resultado da consulta (resumido).',
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
          errors: [{ status: 400, cause: 'Expressão PromQL inválida.', source: 'Prometheus' }],
        },
      ],
    },
  ],
  config: [
    { language: 'yaml', code: PROMETHEUS_YML, file: 'prometheus.yml' },
    { language: 'yaml', code: COMPOSE_OBSERVABILITY, file: 'docker-compose.yml' },
  ],
  links: [
    { label: 'Interface do Prometheus', url: 'http://localhost:9090' },
    { label: 'Alvos (targets)', url: 'http://localhost:9090/targets' },
    { label: 'Consulta up', url: 'http://localhost:9090/api/v1/query?query=up' },
  ],
  docs: [
    { label: 'Coleta de métricas', path: '/observabilidade/prometheus' },
    { label: 'Alertas', path: '/observabilidade/alertas' },
  ],
};

export const GRAFANA_SERVICE: ServiceInfo = {
  id: 'grafana',
  name: 'Grafana',
  kind: 'observabilidade',
  tagline: 'Dashboards e alertas visuais sobre as métricas do Prometheus.',
  description:
    'Interface de visualização. Não há provisionamento automático no projeto: o datasource Prometheus (http://prometheus:9090) e os dashboards são criados pela interface e persistidos na pasta ./grafana.data (bind mount).',
  responsibilities: ['Visualizar métricas em dashboards.', 'Disparar alertas a partir de consultas PromQL.'],
  port: '3000',
  access: 'http://localhost:3000 · login admin / admin (do .env).',
  image: 'grafana/grafana:latest',
  technologies: ['Grafana', 'Datasource Prometheus', 'Bind mount ./grafana.data'],
  relations: [{ label: 'Consulta', targets: ['prometheus'] }],
  config: [{ language: 'yaml', code: COMPOSE_OBSERVABILITY, file: 'docker-compose.yml' }],
  env: [
    { name: 'GF_SECURITY_ADMIN_USER', value: 'admin', purpose: 'Usuário administrador inicial.' },
    { name: 'GF_SECURITY_ADMIN_PASSWORD', value: 'admin', purpose: 'Senha do administrador inicial.' },
  ],
  links: [{ label: 'Grafana', url: 'http://localhost:3000' }],
  docs: [
    { label: 'Grafana: dashboards', path: '/observabilidade/grafana' },
    { label: 'Alertas', path: '/observabilidade/alertas' },
  ],
};
