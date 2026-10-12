import { code, list, note, page, section, table, text, tip, tree, warn } from '../../shared/content/blocks';
import { c, link } from '../../shared/content/html';
import { ENV_FILE } from '../../shared/content/snippets/config.snippets';
import {
  CUSTOMER_REQUEST,
  CUSTOMER_RESPONSE,
  ERROR_RESPONSE,
  GLOBAL_EXCEPTION_HANDLER,
  CUSTOMER_EXCEPTION_HANDLER,
} from '../../shared/content/snippets/java.snippets';
import { COMMON_EXCEPTIONS_POM, MICROSERVICES_POM, ROOT_POM, ROOT_POM_MODULES } from '../../shared/content/snippets/maven.snippets';

export const PAGES = {
  'estrutura-de-pastas': page(
    'Pastas e pacotes',
    'O repositório é um aggregator Maven na raiz. Plataforma (config, discovery, gateway) fica ao lado da pasta microservices, que agrega os três serviços e a lib interna.',
    section(
      'arvore',
      'Árvore do repositório',
      tree(
        [
          {
            label: 'ecommerce (POM raiz)',
            kind: 'module',
            children: [
              { label: 'config-server/', kind: 'module', note: ':8888' },
              { label: 'discovery-server/', kind: 'module', note: ':8761' },
              { label: 'api-gateway/', kind: 'module', note: ':8222' },
              {
                label: 'microservices/',
                kind: 'module',
                children: [
                  { label: 'common-exceptions/', kind: 'module', note: 'JAR, skip Boot plugin' },
                  { label: 'customer-microservice/', kind: 'module' },
                  { label: 'product-microservice/', kind: 'module' },
                  { label: 'cart-microservice/', kind: 'module' },
                ],
              },
              { label: 'docker-compose.yml', kind: 'file' },
              { label: '.env', kind: 'file' },
              { label: 'prometheus.yml', kind: 'file' },
              { label: 'documentation-website/', kind: 'folder', note: 'este site' },
            ],
          },
        ],
        'Cada módulo Spring Boot tem o src/main/java usual + Dockerfile na pasta do módulo.',
      ),
    ),
    section(
      'pacotes',
      'Pacotes Java',
      text(
        `Base ${c('com.gustavoleterio...')}. Serviços de negócio usam package by feature: ${c('...customer_microservice.customer')}, ${c('...product_microservice.product')} e ${c('.category')}, ${c('...cart_microservice.cart')} + ${c('.item')} + clientes Feign. Handlers em ${c('.exceptions')}.`,
      ),
    ),
  ),

  modularizacao: page(
    'Modularização no POM',
    'Maven multi-módulo: um POM com packaging pom lista filhos em <modules>. O reactor constrói na ordem das dependências.',
    section(
      'modules',
      'Dois níveis de agregação',
      text('A raiz agrega a plataforma + a pasta microservices. Essa pasta agrega de novo os quatro módulos de negócio/lib.'),
      code('xml', ROOT_POM_MODULES, 'pom.xml'),
      code('xml', MICROSERVICES_POM, 'microservices/pom.xml', 'Repare: este POM também declara dependências que todos os filhos herdam (webmvc, validation, config, eureka, springdoc).'),
    ),
    section(
      'comandos',
      'Construir um módulo e suas dependências',
      text(
        `Os Dockerfiles usam exatamente isso: ${c('-pl')} escolhe o artefato, ${c('-am')} (also-make) constrói o que ele precisa — no cart, o ${c('common-exceptions')} e os POMs pais.`,
      ),
      code('bash', 'mvn clean package -DskipTests -pl microservices/cart-microservice -am'),
    ),
  ),

  'pom-pai-e-filho': page(
    'POM pai e filho',
    'Herança Maven (<parent>) é diferente de agregação (<modules>). Um filho herda properties, dependencyManagement, plugins e as dependências declaradas no pai.',
    section(
      'cadeia',
      'Cadeia de parent',
      table(
        ['POM', 'Parent', 'O que define'],
        [
          ['ecommerce (raiz)', `${c('spring-boot-starter-parent')} 4.1.1`, 'Java 25, Cloud BOM, Lombok, Actuator, plugin Boot.'],
          ['microservices', 'ecommerce', 'Web MVC, validation, Config, Eureka, springdoc, management da lib interna.'],
          ['customer / product / cart', 'microservices', 'Só o que é específico: Mongo, JPA, Feign...'],
          ['config-server, discovery, gateway', 'ecommerce', 'Não passam pelo POM microservices — não ganham webmvc.'],
        ],
      ),
      text(`${c('relativePath')} aponta para o POM pai no disco (${c('../pom.xml')}). Sem isso o Maven procura no repositório local.`),
      code('xml', ROOT_POM, 'pom.xml', 'Parent Boot + modules + dependencyManagement do Cloud.'),
    ),
  ),

  'hierarquia-de-dependencias': page(
    'Hierarquia de dependências',
    'O que está em <dependencies> é herdado de verdade. O que está em <dependencyManagement> só fixa versão/escopo até alguém declarar o artefato.',
    section(
      'dois-blocos',
      'dependencies × dependencyManagement',
      list([
        `${c('<dependencies>')} no pai → todo filho recebe o JAR (Lombok, Actuator, Micrometer na raiz; Web MVC no POM microservices).`,
        `${c('<dependencyManagement>')} + ${c('scope=import')} do ${c('spring-cloud-dependencies')} → versões do Cloud sem repetir número.`,
        `A lib ${c('common-exceptions')} é gerenciada no POM microservices e ${c('declarada')} em cada serviço.`,
        `Driver PostgreSQL no product está ${c('runtime')}: não vai para compile, só para o container.`,
      ]),
      tip(`A tabela completa por serviço está em cada ficha do ${link('/explorador', 'Explorador')} (coluna Origem).`),
    ),
  ),

  'common-exceptions': page(
    'Common-exceptions (lib interna)',
    'Módulo Maven que não sobe como processo: gera um JAR comum para customer, product e cart.',
    section(
      'skip',
      'Não é uma aplicação Boot',
      text(
        `O ${c('spring-boot-maven-plugin')} herdado tentaria gerar um fat JAR executável. ${c('<skip>true</skip>')} desliga isso. O artefato fica um JAR de biblioteca, com ${c('ErrorResponse')} e ${c('GlobalExceptionHandler')} no classpath de quem depende.`,
      ),
      code('xml', COMMON_EXCEPTIONS_POM, 'microservices/common-exceptions/pom.xml'),
      code('java', ERROR_RESPONSE, 'ErrorResponse.java'),
    ),
    section(
      'consumo',
      'Como os serviços consomem',
      text(
        `Declaram ${c('com.gustavoleterio.microservices:common-exceptions')}. O handler global entra no component scan porque o pacote ${c('com.gustavoleterio.microservices')} é pai dos pacotes das aplicações? Na prática o ${c('@RestControllerAdvice')} da lib é um ${c('@Component')} — para ser visto, o scan da aplicação precisa alcançá-lo ou o serviço precisa estender a classe (é o que customer e product fazem).`,
      ),
      note('O cart não estende GlobalExceptionHandler: usa ResponseEntityExceptionHandler do Spring. A lib ainda entra pelo record ErrorResponse.'),
    ),
  ),

  'captura-de-exceptions': page(
    'Captura de exceptions',
    'Dois modelos: herança do GlobalExceptionHandler (customer/product) e ResponseEntityExceptionHandler (cart). @RestControllerAdvice + @ExceptionHandler escolhem o método pelo tipo da exceção.',
    section(
      'global',
      'GlobalExceptionHandler',
      code('java', GLOBAL_EXCEPTION_HANDLER, 'GlobalExceptionHandler.java'),
      warn(
        `O ${c('handleException(Exception)')} é um catch-all. No Spring MVC, ${c('NoHandlerFoundException')} e ${c('HttpRequestMethodNotSupportedException')} também são ${c('Exception')}: rotas inexistentes e método errado saem 500 genérico em vez de 404/405.`,
      ),
    ),
    section(
      'filho',
      'Handler do serviço',
      text(
        `${c('@Primary')} no ${c('CustomerExceptionHandler')} desambigua quando os dois advices existem. Ele só acrescenta o 404 de ${c('CustomerNotFoundException')}; o resto continua no pai.`,
      ),
      code('java', CUSTOMER_EXCEPTION_HANDLER, 'CustomerExceptionHandler.java'),
    ),
    section(
      'cart',
      'Cart não herda a lib',
      text(
        `Estende ${c('ResponseEntityExceptionHandler')}: validação e type mismatch saem como ProblemDetail. Feign e ${c('CartException')} têm métodos próprios. O que não for tratado cai no ${c('/error')} do Boot (formato diferente do ${c('ErrorResponse')}).`,
      ),
    ),
  ),

  'records-como-dtos': page(
    'Records como DTOs',
    'Java record gera classe imutável: construtor, accessors, equals, hashCode. O projeto usa records na borda HTTP e classes Lombok nas entidades persistidas.',
    section(
      'request-response',
      'Request e Response',
      code('java', CUSTOMER_REQUEST, 'CustomerRequest.java', '@NotBlank / @Email entram no Bean Validation quando o controller usa @Valid.'),
      code('java', CUSTOMER_RESPONSE, 'CustomerResponse.java', '@Builder do Lombok em record exige o annotation processor configurado no POM raiz.'),
      list([
        `Entidade ${c('Customer')} / ${c('Product')} / ${c('Cart')} continua sendo classe: precisa de setters para JPA/Mongo e de mutação no domínio do cart.`,
        `${c('Item')} no cart é ao mesmo tempo documento embutido e body da API — mistura de camadas, mas reduz arquivos.`,
        `Feign no cart declara ${c('CustomerResponse')} e ${c('ProductResponse')} locais, cópias do contrato remoto (não compartilham o record do outro módulo).`,
      ]),
    ),
  ),

  lombok: page(
    'Lombok',
    'Geração de boilerplate em tempo de compilação. O POM raiz declara a dependência optional e configura annotationProcessorPaths no maven-compiler-plugin.',
    section(
      'uso',
      'Anotações no código',
      table(
        ['Anotação', 'Onde'],
        [
          [`${c('@Data')} / ${c('@Builder')} / ${c('@NoArgsConstructor')}`, 'Documentos Mongo (Customer), várias DTOs.'],
          [`${c('@Getter')} / ${c('@Setter')} (sem @Data)`, 'Entidades JPA — evita toString/hashCode em coleções lazy.'],
          [`${c('@RequiredArgsConstructor')}`, `Controllers e services: injeta os ${c('final')}.`],
          [`${c('@Slf4j')}`, `Handlers: ${c('log.warn')} / ${c('log.error')}.`],
          [`${c('@EqualsAndHashCode(callSuper = true)')}`, 'CustomerNotFoundException.'],
        ],
      ),
      tip('No IDE, instale o plugin Lombok. Sem annotation processing, o projeto não compila: os getters “não existem” no fonte.'),
    ),
  ),

  'variaveis-de-ambiente': page(
    'Variáveis de ambiente (.env)',
    'Três camadas: arquivo .env para o Compose, environment: nos serviços, placeholders ${...} nos YAMLs do Config Server. O Spring Boot não lê o .env sozinho.',
    section(
      'fluxo',
      'De .env até a property',
      list([
        `Compose interpola ${c('${MONGO_DB_USERNAME}')} do arquivo ${c('.env')}.`,
        `O serviço recebe, por exemplo, ${c('SPRING_MONGODB_URI=mongodb://root:pass@mongodb:27017/customer_db?authSource=admin')}.`,
        `Relaxed binding: ${c('SPRING_MONGODB_URI')} vira ${c('spring.mongodb.uri')}.`,
        `No YAML do Config Server ainda há ${c('${SPRING_MONGODB_URI}')} — o cliente resolve na subida.`,
      ]),
      code('ini', ENV_FILE, '.env'),
      note(
        `Import de properties (${c('spring.config.import')}) é o outro caminho de configuração: está documentado em ${link('/arquitetura/import-de-properties', 'Import de properties')}, junto do Config Server.`,
      ),
    ),
  ),
};
