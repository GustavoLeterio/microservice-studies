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

export const PAGES = {
  'imagens-e-containers': page(
    'Imagens e containers',
    'Imagem é o pacote imutável (camadas). Container é o processo em execução a partir dela. Compose declara os containers; Dockerfile descreve como gerar a imagem das apps Java.',
    section(
      'usadas',
      'Imagens deste projeto',
      table(
        ['Imagem', 'Uso'],
        [
          ['eclipse-temurin:25-jdk-alpine', 'Estágio de build (compila com Maven).'],
          ['eclipse-temurin:25-jre-alpine', 'Estágio de runtime (só roda o JAR).'],
          ['mongo / postgres', 'Bancos oficiais, tag latest implícita.'],
          ['prom/prometheus:latest', 'Coleta de métricas.'],
          ['grafana/grafana:latest', 'Dashboards.'],
        ],
      ),
      text(
        `As apps próprias não vêm de um registry: ${c('build: { context: ., dockerfile: ./.../Dockerfile }')} gera a imagem na máquina. ${c('docker compose up --build')} reconstrói quando o contexto muda.`,
      ),
    ),
  ),

  dockerfile: page(
    'Comandos de build',
    'Cada instrução do Dockerfile cria uma camada. O config-server tem os comentários mais completos; os outros copiam o mesmo padrão.',
    section(
      'instrucoes',
      'Instruções',
      table(
        ['Instrução', 'Neste projeto'],
        [
          ['FROM', 'Duas vezes: JDK (AS build) e JRE.'],
          ['WORKDIR /app', 'Diretório padrão dos comandos seguintes.'],
          ['RUN apk add --no-cache maven', 'Maven não vem na Temurin. apk na Alpine.'],
          ['COPY . .', 'Manda o contexto (a raiz do repo, ver docker-compose build.context).'],
          ['RUN mvn ... -pl ... -am', 'Empacota só o módulo e dependências Maven.'],
          ['COPY --from=build ... app.jar', 'Traz o JAR do estágio anterior.'],
          ['EXPOSE', `Documenta a porta; não publica. Quem publica é o Compose ${c('ports:')}.`],
          ['ENTRYPOINT ["java","-jar","app.jar"]', 'PID 1 do container.'],
        ],
      ),
      code('dockerfile', CONFIG_SERVER_DOCKERFILE, 'config-server/Dockerfile'),
    ),
  ),

  'multi-stage': page(
    'Imagem Java e multi-stage',
    'JDK compila; JRE executa. Multi-stage deixa a imagem final sem Maven, sem fonte e sem compiler — menor e com menos superfície.',
    section(
      'jdk-jre',
      'JDK × JRE',
      list([
        `JDK (Java Development Kit): javac, ferramentas, Maven precisa dele para ${c('package')}.`,
        `JRE (Java Runtime Environment): só a VM. Suficiente para ${c('java -jar')}.`,
        'Alpine: libc musl, imagens menores. Temurin oficial da Eclipse Adoptium.',
      ]),
      code('dockerfile', DOCKERFILE_BUILD_STAGE, undefined, 'Estágio build'),
      code('dockerfile', DOCKERFILE_RUNTIME_STAGE, undefined, 'Estágio runtime'),
      code('dockerfile', CUSTOMER_DOCKERFILE, 'microservices/customer-microservice/Dockerfile'),
    ),
    section(
      'cache',
      'Limitação atual',
      text(
        `${c('COPY . .')} antes do ${c('mvn')} invalida o cache a cada mudança de fonte. Um desenho que copia só os POMs primeiro reaproveita as dependências baixadas:`,
      ),
      code('dockerfile', DOCKERFILE_CACHE_SUGGESTION, undefined, 'Sugestão — não está aplicada nos Dockerfiles atuais.'),
    ),
  ),

  'compose-servicos': page(
    'Configuração dos serviços',
    'docker-compose.yml descreve o grafo: build, depends_on com healthcheck, environment, networks e ports.',
    section(
      'padrao',
      'Padrão de um serviço Java',
      list([
        `${c('build.context: .')} — o Dockerfile vê o POM raiz (obrigatório para ${c('-am')}).`,
        `${c('depends_on: condition: service_healthy')} em config-server, discovery e bancos.`,
        `${c('SPRING_CONFIG_IMPORT')} e ${c('EUREKA_DEFAULT_ZONE')} apontando para os hostnames Compose, não localhost.`,
        `Rede bridge ${c('microservices')}: DNS interno (postgres, mongodb, config-server...).`,
      ]),
      table(
        ['Serviço', 'Porta no host'],
        [
          ['api-gateway', '${GATEWAY_SERVER_PORT}:8222'],
          ['config-server', '${CONFIG_SERVER_PORT}:8888'],
          ['discovery-server', '${DISCOVERY_SERVER_PORT}:8761'],
          ['customer-microservice', '${CUSTOMER_MICROSERVICE_PORT}:8091'],
          ['product / cart', 'não publicadas'],
        ],
      ),
      note('Healthcheck do config/discovery usa curl contra /actuator/health. Por isso os Dockerfiles instalam curl na JRE Alpine.'),
    ),
  ),

  'compose-bancos-e-volumes': page(
    'Bancos de dados e volumes',
    'Volume nomeado sobrevive a docker compose down. Bind mount amarra uma pasta do host (logs, grafana.data).',
    section(
      'bancos',
      'Mongo e Postgres',
      code('yaml', COMPOSE_DATABASES, 'docker-compose.yml'),
      list([
        `Mongo: usuário root via ${c('MONGO_INITDB_*')}; os serviços autenticam com ${c('authSource=admin')} e escolhem ${c('customer_db')} / ${c('cart_db')} na URI.`,
        `Postgres: ${c('POSTGRES_DB=product_db')} cria o banco na primeira subida. Credenciais iguais às do datasource do product.`,
      ]),
    ),
    section(
      'volumes',
      'Volumes e bind mounts',
      code('yaml', COMPOSE_VOLUMES_NETWORKS, 'docker-compose.yml'),
      table(
        ['Declaração', 'Tipo', 'Efeito'],
        [
          ['mongo: / postgres:', 'volume nomeado', 'Dados do banco persistem.'],
          ['./microservices/.../logs:/app/logs', 'bind mount', 'Arquivo de log visível no host.'],
          ['./prometheus.yml:/etc/prometheus/prometheus.yml', 'bind', 'Config do Prometheus.'],
          ['./grafana.data:/var/lib/grafana', 'bind', 'Dashboards sobrevivem ao recreate.'],
        ],
      ),
      warn(
        `Há um ${c('config-server:')} solto no fim do bloco ${c('networks:')}. É YAML inválido/morto (fica como chave da rede). E o volume ${c('grafana-data')} é declarado mas o serviço usa o bind ${c('./grafana.data')}.`,
      ),
      code('yaml', COMPOSE_OBSERVABILITY, 'prometheus + grafana'),
    ),
  ),

  dockerignore: page(
    '.dockerignore',
    'O contexto de build é a raiz. Sem ignore, cada docker build mandaria target/, .git, node_modules do site, logs...',
    section(
      'arquivo',
      'O que é excluído',
      code('text', DOCKERIGNORE, '.dockerignore'),
      text(
        `Isso reduz o contexto e evita invalidar cache à toa. O site Angular (${c('documentation-website/')}) já está ignorado, para não entrar nas imagens Java.`,
      ),
    ),
  ),
};
