import { code, list, note, page, section, steps, table, text, tip, warn, danger } from '../../shared/content/blocks';
import { c, link } from '../../shared/content/html';

export const PAGES = {
  'novo-microservico': page(
    'Criar um novo microserviço',
    'Checklist do jeito que o repositório está hoje — Maven aninhado, Config Server native, Eureka, Gateway, Compose e Prometheus via Eureka SD.',
    section(
      'passos',
      'Passo a passo',
      steps([
        {
          title: 'Módulo Maven',
          html: `Crie ${c('microservices/order-microservice/')} (exemplo) com ${c('parent')} = ${c('microservices')}. Declare só o que for específico (fila, outro banco). A lib ${c('common-exceptions')} entra como dependência se for API REST MVC.`,
        },
        {
          title: 'Agregar no POM',
          html: `Some ${c('<module>order-microservice</module>')} em ${c('microservices/pom.xml')}.`,
        },
        {
          title: 'Código Spring Boot',
          html: `Classe ${c('@SpringBootApplication')} no pacote ${c('com.gustavoleterio.microservices...')}, package by feature, ${c('application.yml')} só com ${c('spring.application.name')} e ${c('spring.config.import')}.`,
        },
        {
          title: 'YAML no Config Server',
          html: `Arquivo ${c('config-server/src/main/resources/config/order-microservice.yml')} com porta, eureka, management, logging, datasource se houver.`,
        },
        {
          title: 'Rota no gateway',
          html: `Em ${c('api-gateway.yml')}: ${c('id')}, ${c('uri: lb://order-microservice')}, ${c('Path=/api/v1/orders/**')} e, se quiser Swagger, ${c('/v3/api-docs/orders')} + entrada em ${c('springdoc.swagger-ui.urls')}.`,
        },
        {
          title: 'Dockerfile',
          html: `Copie o do customer. Troque ${c('-pl microservices/order-microservice')} e o ${c('COPY --from=build')} para o target desse módulo. EXPOSE a porta do YAML.`,
        },
        {
          title: 'Compose',
          html: `Serviço com ${c('depends_on')} config + discovery (+ banco). ${c('environment')} com ${c('SPRING_CONFIG_IMPORT')} e ${c('EUREKA_DEFAULT_ZONE')}. Só publique ${c('ports')} se quiser acesso direto.`,
        },
        {
          title: 'Prometheus',
          html: `Nada a fazer no ${c('prometheus.yml')} se o serviço se registrar no Eureka com Actuator + micrometer-registry-prometheus (já herdados). Confira em /targets.`,
        },
        {
          title: 'Documentar',
          html: `Ficha no Explorador (dados em ${c('shared/data/system')}) e, se o conceito for novo, uma página no tópico certo.`,
        },
      ]),
      tip(`Teste isolado: ${c('mvn -pl microservices/order-microservice -am spring-boot:run')} com Config Server já no ar.`),
    ),
  ),

  'pontos-de-atencao': page(
    'Pontos de atenção',
    'Comportamentos reais do código atual — bugs, atalhos de estudo e melhorias naturais. Não são “erros da documentação”: estão no repositório.',
    section(
      'bugs',
      'Bugs',
      danger(
        `${c('CartService')} cria o carrinho com ${c('List.of()')} (imutável). O primeiro ${c('addItem')} dispara ${c('UnsupportedOperationException')} → 500 do ${c('/error')}. Use ${c('new ArrayList<>()')}.`,
        'Carrinho vazio',
      ),
      warn(
        `Gateway: ${c('server.port: ${SPRING_CONFIG_IMPORT:...}')} no ${c('application.yml')} local. No Docker ${c('SPRING_CONFIG_IMPORT')} salva; fora dele, a porta vira um texto de URI.`,
        'Import no lugar da porta',
      ),
      warn(
        `Logging do cart aponta arquivo e logger do customer (cópia). ${c('GlobalExceptionHandler')} devolve 500 para rota inexistente. PUT de categoria duplicada e DELETE com filhos viram 500 de constraint. ${c('CategoryRequest')} sem ${c('@NotBlank')}.`,
      ),
    ),
    section(
      'estudo',
      'Atalhos aceitáveis no estudo',
      list([
        `${c('ddl-auto: update')} e imagens ${c('latest')} sem pin de versão.`,
        'Config Server native (classpath) em vez de Git.',
        'Senhas no .env em texto puro.',
        'Sem autenticação, rate limit, circuit breaker ou testes de contrato.',
      ]),
    ),
    section(
      'melhorias',
      'Melhorias coerentes',
      list([
        'Cache de dependências nos Dockerfiles (POMs primeiro).',
        `Alertas Prometheus para ${c('up == 0')}.`,
        'Provisioning do datasource Grafana.',
        `Tirar ${c('documentation-website/')} do contexto Docker.`,
        `Remover a chave morta ${c('config-server:')} em ${c('networks:')}.`,
        `Cart herdar o mesmo ${c('ErrorResponse')} / não engolir 404 do Feign como 400.`,
      ]),
    ),
  ),

  glossario: page(
    'Glossário',
    'Termos usados neste site, no sentido em que o código os aplica.',
    section(
      'termos',
      'Termos',
      table(
        ['Termo', 'Significado aqui'],
        [
          ['Bounded context', 'Limite de modelo: customer, product ou cart, cada um com seu banco.'],
          ['BOM', `POM importado só para gerenciar versões (${c('spring-cloud-dependencies')}).`],
          ['Client-side LB', `Quem chama escolhe a instância (Feign, ${c('lb://')}).`],
          ['Config native', 'YAMLs dentro do JAR do Config Server, não num Git.'],
          ['Database per service', 'Nada de tabela compartilhada; no máximo o mesmo processo Mongo com dois bancos.'],
          ['Eureka', 'Registro de instâncias (nome, IP, porta, status).'],
          ['Feign', 'HTTP client por interface anotada.'],
          ['Leste-oeste', 'Serviço → serviço na rede interna.'],
          ['Norte-sul', 'Cliente externo → gateway → serviço.'],
          ['ProblemDetail', `RFC 7807 usado pelo ${c('ResponseEntityExceptionHandler')} no cart.`],
          ['Relaxed binding', `${c('SPRING_CONFIG_IMPORT')} ≡ ${c('spring.config.import')}.`],
          ['RewritePath', 'Filtro do Gateway que troca o path antes de encaminhar.'],
          ['springdoc', 'Gera OpenAPI a partir do código Spring.'],
        ],
      ),
    ),
  ),
};
