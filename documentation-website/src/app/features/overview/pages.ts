import { architectureDiagram, cards, code, flow, list, note, page, section, table, text, tip } from '../../shared/content/blocks';
import { c, link } from '../../shared/content/html';
import { ENV_FILE } from '../../shared/content/snippets/config.snippets';

export const PAGES = {
  'o-sistema': page(
    'O sistema',
    'Um e-commerce didático em microserviços: cadastro de clientes, catálogo de produtos e carrinho de compras, atrás de um gateway único.',
    section(
      'dominio',
      'Domínio',
      text(
        `O repositório modela o recorte mínimo de uma loja. Não há pagamento, pedido nem autenticação: o objetivo é exercitar a <strong>plataforma</strong> (configuração central, descoberta, roteamento, observabilidade) em cima de três bounded contexts claros.`,
      ),
      cards([
        {
          title: 'Clientes',
          tag: 'MongoDB',
          link: '/explorador/servicos/customer-microservice',
          html: 'CRUD de cadastro. Fonte da verdade sobre quem é o cliente.',
        },
        {
          title: 'Produtos',
          tag: 'PostgreSQL',
          link: '/explorador/servicos/product-microservice',
          html: 'Categorias e produtos com preço e estoque. Único serviço relacional.',
        },
        {
          title: 'Carrinho',
          tag: 'MongoDB + Feign',
          link: '/explorador/servicos/cart-microservice',
          html: 'Um carrinho por cliente. Valida cliente, produto e estoque em outros serviços.',
        },
      ]),
    ),
    section(
      'pecas',
      'Peças além do negócio',
      table(
        ['Peça', 'Papel'],
        [
          [`${link('/explorador/servicos/config-server', 'config-server')} (:8888)`, 'Entrega o YAML de cada aplicação.'],
          [`${link('/explorador/servicos/discovery-server', 'discovery-server')} (:8761)`, 'Registro Eureka das instâncias.'],
          [`${link('/explorador/servicos/api-gateway', 'api-gateway')} (:8222)`, 'Única porta de entrada HTTP externa.'],
          [`${link('/explorador/servicos/mongodb', 'MongoDB')} e ${link('/explorador/servicos/postgres', 'PostgreSQL')}`, 'Persistência por serviço (bancos lógicos separados).'],
          [`${link('/explorador/servicos/prometheus', 'Prometheus')} e ${link('/explorador/servicos/grafana', 'Grafana')}`, 'Métricas e dashboards.'],
          [link('/explorador/servicos/common-exceptions', 'common-exceptions'), 'JAR interno com ErrorResponse e o advice global.'],
        ],
      ),
    ),
    section(
      'fluxo',
      'Fluxo de uma requisição',
      text('Do navegador até o banco, uma chamada típica atravessa o gateway, o Eureka e o serviço de negócio:'),
      flow(
        [
          { label: 'Cliente HTTP', sub: 'browser / curl', tone: 'external' },
          { label: 'API Gateway', sub: ':8222 · lb://', tone: 'platform' },
          { label: 'Eureka', sub: 'escolhe instância', tone: 'platform' },
          { label: 'Microserviço', sub: 'MVC + banco' },
        ],
        'Tráfego norte-sul. O carrinho ainda faz tráfego leste-oeste via OpenFeign.',
      ),
      tip(
        `O catálogo vivo de rotas, corpos, respostas e erros está no ${link('/explorador', 'Explorador do sistema')}. Os tópicos da sidebar explicam o desenho por trás disso.`,
      ),
    ),
  ),

  arquitetura: page(
    'Mapa da arquitetura',
    'Visão única dos containers, portas e comunicações. Clique nos blocos do diagrama para abrir a ficha de cada serviço.',
    section('diagrama', 'Diagrama', architectureDiagram()),
    section(
      'leitura',
      'Como ler',
      list([
        'A faixa de cima é o tráfego que entra pela internet (norte-sul).',
        'A faixa do meio é a plataforma Spring Cloud: Config, Eureka e Gateway.',
        'A faixa de baixo são os três microserviços e os bancos. O cart chama customer e product (leste-oeste).',
        'Prometheus descobre alvos no Eureka; Grafana consulta o Prometheus.',
      ]),
      note(
        `Réplicas: product e cart não publicam porta no ${c('docker-compose.yml')}, então dá para escalar com ${c('docker compose up --scale')}. O customer publica ${c('8091')} e hoje fica com uma instância acessível direto.`,
      ),
    ),
  ),

  stack: page(
    'Stack tecnológica',
    'Versões e papéis das bibliotecas que o código realmente usa — herdadas dos POMs pai ou declaradas no serviço.',
    section(
      'runtime',
      'Linguagem e runtime',
      table(
        ['Tecnologia', 'Versão / origem', 'Onde entra'],
        [
          ['Java', `25 (${c('java.version')} no POM raiz)`, 'Todos os módulos.'],
          ['Spring Boot', `4.1.1 (parent ${c('spring-boot-starter-parent')})`, 'Todos os módulos.'],
          ['Spring Cloud', `2025.1.3 (BOM ${c('spring-cloud-dependencies')})`, 'Config, Eureka, Gateway, Feign, LoadBalancer.'],
          ['Lombok', `versão do Boot (${c('lombok.version')})`, 'POM raiz + annotation processor.'],
        ],
      ),
    ),
    section(
      'servicos',
      'Por tipo de serviço',
      table(
        ['Camada', 'Tecnologias'],
        [
          ['Negócio (customer / product / cart)', 'Spring Web MVC, Bean Validation, Config Client, Eureka Client, springdoc 3.1.1, Actuator, Micrometer Prometheus.'],
          ['Customer e Cart', 'Spring Data MongoDB.'],
          ['Product', 'Spring Data JPA, Hibernate, driver PostgreSQL (runtime).'],
          ['Cart', 'OpenFeign + Spring Cloud LoadBalancer.'],
          ['API Gateway', 'Spring Cloud Gateway WebFlux (Netty), LoadBalancer, Eureka Client, springdoc webflux-ui.'],
          ['Config Server', `spring-cloud-config-server, perfil ${c('native')}.`],
          ['Discovery', 'spring-cloud-starter-netflix-eureka-server.'],
        ],
      ),
      tip(`A ficha de cada serviço no ${link('/explorador', 'Explorador')} lista as dependências Maven com escopo e origem (POM raiz, POM microservices ou POM do próprio módulo).`),
    ),
    section(
      'infra',
      'Infraestrutura',
      list([
        `${c('eclipse-temurin:25-jdk-alpine')} no estágio de build e ${c('eclipse-temurin:25-jre-alpine')} no runtime.`,
        'MongoDB e PostgreSQL oficiais, Prometheus e Grafana latest.',
        `Orquestração local com Docker Compose e um arquivo ${c('.env')} na raiz.`,
      ]),
    ),
  ),

  'como-executar': page(
    'Como executar',
    'O caminho oficial é Docker Compose. As variáveis de porta, senha e nome de banco estão no .env da raiz.',
    section(
      'compose',
      'Subir tudo',
      text(`Na raiz do repositório (onde está o ${c('docker-compose.yml')}):`),
      code('bash', 'docker compose --env-file .env up --build', undefined, 'Sobe bancos, plataforma, microserviços, Prometheus e Grafana.'),
      table(
        ['URL', 'O que é'],
        [
          ['http://localhost:8222', 'API Gateway — use esta para as APIs.'],
          ['http://localhost:8222/swagger-ui.html', 'Swagger agregado.'],
          ['http://localhost:8888/customer-microservice/default', 'YAML servido pelo Config Server.'],
          ['http://localhost:8761', 'Painel do Eureka.'],
          ['http://localhost:8091', 'Customer direto (única API de negócio com porta publicada).'],
          ['http://localhost:9090', 'Prometheus.'],
          ['http://localhost:3000', 'Grafana (admin / admin).'],
        ],
      ),
    ),
    section(
      'escala',
      'Réplicas',
      code('bash', 'docker compose up --scale product-microservice=2 --scale cart-microservice=2'),
      text(
        `O gateway e o Feign do cart resolvem ${c('lb://product-microservice')} / ${c('lb://CUSTOMER-MICROSERVICE')} pelo Eureka, então as novas instâncias entram no rodízio depois do registro. Não escale o customer pelo compose se quiser continuar acessando ${c('localhost:8091')} — a porta do host colide.`,
      ),
    ),
    section(
      'env',
      'Arquivo .env',
      text(`O Compose interpola \${...} com estes valores. Não é lido automaticamente pelo Spring Boot: o que chega na JVM são as variáveis do bloco ${c('environment:')} de cada serviço.`),
      code('ini', ENV_FILE, '.env'),
    ),
    section(
      'local',
      'Rodar um módulo fora do Docker',
      list([
        'Suba pelo menos config-server, discovery-server e o banco do serviço.',
        `Cada ${c('application.yml')} local importa ${c('optional:configserver:http://localhost:8888')}.`,
        `Maven: ${c('mvn -pl microservices/customer-microservice -am spring-boot:run')}.`,
      ]),
      note(
        `O ${c('api-gateway/src/main/resources/application.yml')} colocou o placeholder de import em ${c('server.port')} — um engano. No Docker isso é coberto por ${c('SPRING_CONFIG_IMPORT')}. Detalhe em ${link('/guias/pontos-de-atencao', 'Pontos de atenção')}.`,
      ),
    ),
  ),
};
