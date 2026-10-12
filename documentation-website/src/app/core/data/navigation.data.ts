import { SERVICE_KIND_ORDER, SYSTEM_SERVICES } from '../../shared/data/system';
import { NavPage, NavTopic } from '../../shared/models/navigation.models';
import { SERVICE_KIND_LABEL } from '../../shared/models/system.models';

const servicePages: NavPage[] = SERVICE_KIND_ORDER.flatMap((kind) =>
  SYSTEM_SERVICES.filter((service) => service.kind === kind).map((service, index) => ({
    title: service.name,
    path: `/explorador/servicos/${service.id}`,
    summary: service.tagline,
    keywords: [...service.technologies, service.port ?? '', SERVICE_KIND_LABEL[kind]],
    group: index === 0 ? SERVICE_KIND_LABEL[kind] : undefined,
  })),
);

/**
 * Árvore da sidebar. A ordem segue um caminho de leitura:
 * orientar (visão geral) → navegar o sistema (explorador) → aprofundar conceitos
 * (microserviços, código, arquitetura, Docker, observabilidade) → guias.
 *
 * O Explorador fica cedo de propósito: é o catálogo vivo de serviços, endpoints,
 * respostas e erros. Os tópicos seguintes explicam o *porquê* e o *como* do código.
 */
export const NAVIGATION: NavTopic[] = [
  {
    id: 'visao-geral',
    title: 'Visão geral',
    icon: 'layers',
    description: 'O que o sistema faz, como as peças se encaixam e como rodar tudo.',
    basePath: '/visao-geral',
    pages: [
      {
        title: 'O sistema',
        path: '/visao-geral/o-sistema',
        summary: 'Domínio de e-commerce, serviços e fluxo de uma requisição.',
        keywords: ['e-commerce', 'domínio', 'clientes', 'produtos', 'carrinho'],
      },
      {
        title: 'Mapa da arquitetura',
        path: '/visao-geral/arquitetura',
        summary: 'Diagrama com todos os componentes, portas e comunicações.',
        keywords: ['diagrama', 'portas', 'componentes'],
      },
      {
        title: 'Stack tecnológica',
        path: '/visao-geral/stack',
        summary: 'Linguagem, frameworks, bancos e ferramentas com versões.',
        keywords: ['java 25', 'spring boot', 'spring cloud', 'versões', 'tecnologias'],
      },
      {
        title: 'Como executar',
        path: '/visao-geral/como-executar',
        summary: 'Subir com Docker Compose, escalar réplicas e rodar localmente.',
        keywords: ['docker compose up', 'scale', 'rodar', 'executar', 'urls'],
      },
    ],
  },
  {
    id: 'explorador',
    title: 'Explorador do sistema',
    icon: 'compass',
    description: 'Navegue por serviços, endpoints, respostas, erros e dependências.',
    basePath: '/explorador',
    pages: [
      {
        title: 'Mapa do sistema',
        path: '/explorador',
        summary: 'Todos os serviços e componentes em um só lugar.',
        keywords: ['mapa', 'serviços', 'componentes'],
        group: 'Visão',
      },
      {
        title: 'Catálogo de endpoints',
        path: '/explorador/endpoints',
        summary: 'Todas as rotas com respostas e erros, filtráveis.',
        keywords: ['endpoints', 'rotas', 'catálogo', 'respostas', 'erros'],
      },
      ...servicePages,
    ],
  },
  {
    id: 'microservicos',
    title: 'Microserviços',
    icon: 'box',
    description: 'O que cada serviço faz, como é construído e como se comunica.',
    basePath: '/microservicos',
    pages: [
      {
        title: 'O que fazem e como fazem',
        path: '/microservicos/conceito',
        summary: 'Conceito de microserviço e a responsabilidade de cada um.',
        keywords: ['conceito', 'responsabilidade', 'bounded context', 'database per service'],
      },
      {
        title: 'Camadas (MVC)',
        path: '/microservicos/camadas-mvc',
        summary: 'Controller, Service, Repository, Mapper e DTOs.',
        keywords: ['mvc', 'controller', 'service', 'repository', 'mapper', 'camadas'],
      },
      {
        title: 'Persistência',
        path: '/microservicos/persistencia',
        summary: 'MongoDB nos serviços de cliente e carrinho, PostgreSQL/JPA no de produtos.',
        keywords: ['mongodb', 'postgresql', 'jpa', 'hibernate', 'document', 'entity'],
      },
      {
        title: 'Comunicação entre serviços',
        path: '/microservicos/comunicacao',
        summary: 'OpenFeign + LoadBalancer + Eureka no cart-microservice.',
        keywords: ['feign', 'openfeign', 'http', 'síncrona', 'client'],
      },
      {
        title: 'Endpoints',
        path: '/microservicos/endpoints',
        summary: 'Convenções REST e a lista de todas as rotas.',
        keywords: ['rest', 'rotas', 'api', 'get', 'post', 'put', 'patch', 'delete'],
      },
      {
        title: 'Respostas e erros',
        path: '/microservicos/respostas-e-erros',
        summary: 'Formatos de resposta e quais erros cada serviço pode devolver.',
        keywords: ['exceptions', 'erros', 'status', 'errorresponse', 'problemdetail', '404', '500'],
      },
    ],
  },
  {
    id: 'codigo',
    title: 'Estrutura do código Java',
    icon: 'code',
    description: 'Organização Maven, bibliotecas internas e padrões de código.',
    basePath: '/codigo',
    pages: [
      {
        title: 'Pastas e pacotes',
        path: '/codigo/estrutura-de-pastas',
        summary: 'Árvore do repositório e organização por feature.',
        keywords: ['pastas', 'pacotes', 'estrutura', 'package by feature'],
        group: 'Maven',
      },
      {
        title: 'Modularização no POM',
        path: '/codigo/modularizacao',
        summary: 'Projeto multi-módulo: agregação com <modules>.',
        keywords: ['maven', 'modules', 'multi-módulo', 'reactor', '-pl', '-am'],
      },
      {
        title: 'POM pai e filho',
        path: '/codigo/pom-pai-e-filho',
        summary: 'Herança com <parent>: o que cada nível define.',
        keywords: ['parent', 'herança', 'pom pai', 'pom filho', 'relativePath'],
      },
      {
        title: 'Hierarquia de dependências',
        path: '/codigo/hierarquia-de-dependencias',
        summary: 'dependencies x dependencyManagement, BOMs e escopos.',
        keywords: ['dependencyManagement', 'bom', 'import', 'scope', 'versões'],
      },
      {
        title: 'Common-exceptions (lib interna)',
        path: '/codigo/common-exceptions',
        summary: 'Como uma biblioteca interna é criada e consumida.',
        keywords: ['biblioteca', 'lib interna', 'jar', 'skip', 'common'],
        group: 'Exceções',
      },
      {
        title: 'Captura de exceptions',
        path: '/codigo/captura-de-exceptions',
        summary: '@RestControllerAdvice, herança de handlers e ProblemDetail.',
        keywords: ['restcontrolleradvice', 'exceptionhandler', 'responseentityexceptionhandler', 'primary', 'order'],
      },
      {
        title: 'Records como DTOs',
        path: '/codigo/records-como-dtos',
        summary: 'Request/Response imutáveis com records Java.',
        keywords: ['record', 'dto', 'request', 'response', 'imutável'],
        group: 'Padrões e configuração',
      },
      {
        title: 'Lombok',
        path: '/codigo/lombok',
        summary: 'Anotações usadas e a configuração do annotation processor.',
        keywords: ['lombok', 'getter', 'builder', 'data', 'slf4j', 'annotationProcessorPaths'],
      },
      {
        title: 'Variáveis de ambiente (.env)',
        path: '/codigo/variaveis-de-ambiente',
        summary: 'Placeholders, relaxed binding e o arquivo .env.',
        keywords: ['.env', 'env', 'placeholder', 'relaxed binding', 'variáveis'],
      },
    ],
  },
  {
    id: 'arquitetura',
    title: 'Arquitetura',
    icon: 'network',
    description: 'Peças de infraestrutura do Spring Cloud que sustentam os serviços.',
    basePath: '/arquitetura',
    pages: [
      {
        title: 'Centralização de configurações',
        path: '/arquitetura/config-server',
        summary: 'Config Server no perfil native: um YAML por serviço.',
        keywords: ['config server', 'native', 'centralização', 'properties', 'configuração'],
        group: 'Config Server',
      },
      {
        title: 'Import de properties',
        path: '/arquitetura/import-de-properties',
        summary: 'spring.config.import, precedência e placeholders.',
        keywords: ['spring.config.import', 'configserver', 'optional', 'import'],
      },
      {
        title: 'Eureka (service discovery)',
        path: '/arquitetura/eureka',
        summary: 'Registro de instâncias e descoberta pelo nome.',
        keywords: ['eureka', 'discovery', 'registro', 'heartbeat'],
        group: 'Roteamento e descoberta',
      },
      {
        title: 'API Gateway',
        path: '/arquitetura/api-gateway',
        summary: 'Rotas, predicates, filters e lb://.',
        keywords: ['gateway', 'rotas', 'predicates', 'filters', 'webflux'],
      },
      {
        title: 'Server-side e client-side',
        path: '/arquitetura/load-balancer',
        summary: 'Onde o balanceamento acontece neste projeto.',
        keywords: ['load balancer', 'balanceamento', 'round robin', 'réplicas'],
        group: 'Load Balancer',
      },
      {
        title: 'Tráfego norte-sul e leste-oeste',
        path: '/arquitetura/trafego',
        summary: 'Cliente → gateway e serviço → serviço.',
        keywords: ['norte-sul', 'leste-oeste', 'north-south', 'east-west', 'tráfego'],
      },
    ],
  },
  {
    id: 'docker',
    title: 'Docker',
    icon: 'container',
    description: 'Imagens, Dockerfiles multi-stage e orquestração com Compose.',
    basePath: '/docker',
    pages: [
      {
        title: 'Imagens e containers',
        path: '/docker/imagens-e-containers',
        summary: 'Conceitos e as imagens usadas no projeto.',
        keywords: ['imagem', 'container', 'registry', 'docker ps'],
      },
      {
        title: 'Comandos de build',
        path: '/docker/dockerfile',
        summary: 'Cada instrução dos Dockerfiles explicada.',
        keywords: ['dockerfile', 'from', 'run', 'copy', 'entrypoint', 'expose'],
        group: 'Dockerfile',
      },
      {
        title: 'Imagem Java e multi-stage',
        path: '/docker/multi-stage',
        summary: 'JDK x JRE, eclipse-temurin alpine e build em dois estágios.',
        keywords: ['multi-stage', 'jdk', 'jre', 'temurin', 'alpine'],
      },
      {
        title: 'Configuração dos serviços',
        path: '/docker/compose-servicos',
        summary: 'build, depends_on, healthcheck, environment e redes.',
        keywords: ['docker-compose', 'depends_on', 'healthcheck', 'environment', 'networks'],
        group: 'Docker Compose',
      },
      {
        title: 'Bancos de dados e volumes',
        path: '/docker/compose-bancos-e-volumes',
        summary: 'MongoDB, PostgreSQL, volumes nomeados e bind mounts.',
        keywords: ['volumes', 'bind mount', 'mongo', 'postgres', 'persistência'],
      },
      {
        title: '.dockerignore',
        path: '/docker/dockerignore',
        summary: 'O que fica fora do contexto de build.',
        keywords: ['dockerignore', 'contexto', 'build context'],
        group: 'Contexto de build',
      },
    ],
  },
  {
    id: 'observabilidade',
    title: 'Observabilidade e documentação',
    icon: 'activity',
    description: 'Métricas, dashboards, alertas, logs e documentação de API.',
    basePath: '/observabilidade',
    pages: [
      {
        title: 'Actuator',
        path: '/observabilidade/actuator',
        summary: 'Endpoints de saúde e métricas e sua configuração.',
        keywords: ['actuator', 'health', 'management', 'endpoints'],
        group: 'Métricas',
      },
      {
        title: 'Prometheus: coleta de métricas',
        path: '/observabilidade/prometheus',
        summary: 'Scrape via Eureka, relabel e consultas PromQL.',
        keywords: ['prometheus', 'scrape', 'promql', 'micrometer', 'métricas'],
      },
      {
        title: 'Grafana: dashboards',
        path: '/observabilidade/grafana',
        summary: 'Datasource, dashboards e persistência.',
        keywords: ['grafana', 'dashboard', 'painel', 'datasource'],
      },
      {
        title: 'Alertas',
        path: '/observabilidade/alertas',
        summary: 'Regras no Prometheus/Alertmanager e no Grafana.',
        keywords: ['alertas', 'alertmanager', 'regras', 'alert rules'],
      },
      {
        title: 'Logs',
        path: '/observabilidade/logs',
        summary: 'Configuração de logging, arquivos e volumes.',
        keywords: ['logs', 'logging', 'logback', 'slf4j', 'arquivo'],
        group: 'Logs',
      },
      {
        title: 'Springdoc (OpenAPI)',
        path: '/observabilidade/springdoc',
        summary: 'Geração automática da especificação e do Swagger UI.',
        keywords: ['springdoc', 'openapi', 'swagger', 'api-docs'],
        group: 'Documentação de API',
      },
      {
        title: 'Swagger no API Gateway',
        path: '/observabilidade/swagger-no-gateway',
        summary: 'Swagger UI único agregando os três serviços.',
        keywords: ['swagger', 'gateway', 'swagger-ui', 'rewritepath', 'urls'],
      },
    ],
  },
  {
    id: 'guias',
    title: 'Guias',
    icon: 'book',
    description: 'Passo a passo, pontos de atenção e glossário.',
    basePath: '/guias',
    pages: [
      {
        title: 'Criar um novo microserviço',
        path: '/guias/novo-microservico',
        summary: 'Do módulo Maven até o Prometheus, passo a passo.',
        keywords: ['novo', 'criar', 'passo a passo', 'checklist'],
      },
      {
        title: 'Pontos de atenção',
        path: '/guias/pontos-de-atencao',
        summary: 'Bugs encontrados e melhorias sugeridas.',
        keywords: ['bugs', 'melhorias', 'problemas', 'correções'],
      },
      {
        title: 'Glossário',
        path: '/guias/glossario',
        summary: 'Termos usados na documentação.',
        keywords: ['glossário', 'termos', 'definições'],
      },
    ],
  },
];
