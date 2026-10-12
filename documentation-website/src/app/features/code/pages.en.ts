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

export const PAGES_EN = {
  'estrutura-de-pastas': page(
    'Folders and packages',
    'The repository is a Maven aggregator at the root. The platform (config, discovery, gateway) sits beside the microservices folder, which aggregates the three services and the internal lib.',
    section(
      'arvore',
      'Repository tree',
      tree(
        [
          {
            label: 'ecommerce (root POM)',
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
              { label: 'documentation-website/', kind: 'folder', note: 'this site' },
            ],
          },
        ],
        'Each Spring Boot module has the usual src/main/java plus a Dockerfile in the module folder.',
      ),
    ),
    section(
      'pacotes',
      'Java packages',
      text(
        `Base ${c('com.gustavoleterio...')}. Business services use package by feature: ${c('...customer_microservice.customer')}, ${c('...product_microservice.product')} and ${c('.category')}, ${c('...cart_microservice.cart')} + ${c('.item')} + Feign clients. Handlers in ${c('.exceptions')}.`,
      ),
    ),
  ),

  modularizacao: page(
    'Modularization in the POM',
    'Maven multi-module: a POM with packaging pom lists children in <modules>. The reactor builds in dependency order.',
    section(
      'modules',
      'Two levels of aggregation',
      text('The root aggregates the platform + the microservices folder. That folder aggregates the four business/lib modules again.'),
      code('xml', ROOT_POM_MODULES, 'pom.xml'),
      code('xml', MICROSERVICES_POM, 'microservices/pom.xml', 'Notice: this POM also declares dependencies that every child inherits (webmvc, validation, config, eureka, springdoc).'),
    ),
    section(
      'comandos',
      'Build a module and its dependencies',
      text(
        `The Dockerfiles use exactly this: ${c('-pl')} picks the artifact, ${c('-am')} (also-make) builds what it needs — for cart, ${c('common-exceptions')} and the parent POMs.`,
      ),
      code('bash', 'mvn clean package -DskipTests -pl microservices/cart-microservice -am'),
    ),
  ),

  'pom-pai-e-filho': page(
    'Parent and child POM',
    'Maven inheritance (<parent>) is different from aggregation (<modules>). A child inherits properties, dependencyManagement, plugins, and the dependencies declared in the parent.',
    section(
      'cadeia',
      'Parent chain',
      table(
        ['POM', 'Parent', 'What it defines'],
        [
          ['ecommerce (root)', `${c('spring-boot-starter-parent')} 4.1.1`, 'Java 25, Cloud BOM, Lombok, Actuator, Boot plugin.'],
          ['microservices', 'ecommerce', 'Web MVC, validation, Config, Eureka, springdoc, management of the internal lib.'],
          ['customer / product / cart', 'microservices', 'Only what is specific: Mongo, JPA, Feign...'],
          ['config-server, discovery, gateway', 'ecommerce', 'They do not go through the microservices POM — they do not get webmvc.'],
        ],
      ),
      text(`${c('relativePath')} points at the parent POM on disk (${c('../pom.xml')}). Without it, Maven looks in the local repository.`),
      code('xml', ROOT_POM, 'pom.xml', 'Boot parent + modules + Cloud dependencyManagement.'),
    ),
  ),

  'hierarquia-de-dependencias': page(
    'Dependency hierarchy',
    'What is in <dependencies> is truly inherited. What is in <dependencyManagement> only pins version/scope until someone declares the artifact.',
    section(
      'dois-blocos',
      'dependencies vs dependencyManagement',
      list([
        `${c('<dependencies>')} in the parent → every child receives the JAR (Lombok, Actuator, Micrometer at the root; Web MVC in the microservices POM).`,
        `${c('<dependencyManagement>')} + ${c('scope=import')} of ${c('spring-cloud-dependencies')} → Cloud versions without repeating the number.`,
        `The ${c('common-exceptions')} lib is managed in the microservices POM and ${c('declared')} in each service.`,
        `The PostgreSQL driver in product is ${c('runtime')}: it does not go to compile, only into the container.`,
      ]),
      tip(`The full table per service is on each ${link('/explorador', 'Explorer')} profile (Origin column).`),
    ),
  ),

  'common-exceptions': page(
    'Common-exceptions (internal lib)',
    'A Maven module that does not run as a process: it produces a shared JAR for customer, product, and cart.',
    section(
      'skip',
      'It is not a Boot application',
      text(
        `The inherited ${c('spring-boot-maven-plugin')} would try to produce an executable fat JAR. ${c('<skip>true</skip>')} turns that off. The artifact stays a library JAR, with ${c('ErrorResponse')} and ${c('GlobalExceptionHandler')} on the classpath of whoever depends on it.`,
      ),
      code('xml', COMMON_EXCEPTIONS_POM, 'microservices/common-exceptions/pom.xml'),
      code('java', ERROR_RESPONSE, 'ErrorResponse.java'),
    ),
    section(
      'consumo',
      'How the services consume it',
      text(
        `They declare ${c('com.gustavoleterio.microservices:common-exceptions')}. Does the global handler enter component scan because the package ${c('com.gustavoleterio.microservices')} is the parent of the application packages? In practice the lib's ${c('@RestControllerAdvice')} is a ${c('@Component')} — to be seen, the application scan has to reach it, or the service has to extend the class (which is what customer and product do).`,
      ),
      note('Cart does not extend GlobalExceptionHandler: it uses Spring\'s ResponseEntityExceptionHandler. The lib still comes in through the ErrorResponse record.'),
    ),
  ),

  'captura-de-exceptions': page(
    'Exception handling',
    'Two models: inheriting GlobalExceptionHandler (customer/product) and ResponseEntityExceptionHandler (cart). @RestControllerAdvice + @ExceptionHandler pick the method by exception type.',
    section(
      'global',
      'GlobalExceptionHandler',
      code('java', GLOBAL_EXCEPTION_HANDLER, 'GlobalExceptionHandler.java'),
      warn(
        `${c('handleException(Exception)')} is a catch-all. In Spring MVC, ${c('NoHandlerFoundException')} and ${c('HttpRequestMethodNotSupportedException')} are also ${c('Exception')}: missing routes and the wrong method come out as a generic 500 instead of 404/405.`,
      ),
    ),
    section(
      'filho',
      'Service handler',
      text(
        `${c('@Primary')} on ${c('CustomerExceptionHandler')} disambiguates when both advices exist. It only adds the 404 for ${c('CustomerNotFoundException')}; the rest stays in the parent.`,
      ),
      code('java', CUSTOMER_EXCEPTION_HANDLER, 'CustomerExceptionHandler.java'),
    ),
    section(
      'cart',
      'Cart does not inherit the lib',
      text(
        `It extends ${c('ResponseEntityExceptionHandler')}: validation and type mismatch come out as ProblemDetail. Feign and ${c('CartException')} have their own methods. Whatever is not handled falls into Boot's ${c('/error')} (a different format from ${c('ErrorResponse')}).`,
      ),
    ),
  ),

  'records-como-dtos': page(
    'Records as DTOs',
    'A Java record generates an immutable class: constructor, accessors, equals, hashCode. The project uses records at the HTTP edge and Lombok classes for persisted entities.',
    section(
      'request-response',
      'Request and Response',
      code('java', CUSTOMER_REQUEST, 'CustomerRequest.java', '@NotBlank / @Email go through Bean Validation when the controller uses @Valid.'),
      code('java', CUSTOMER_RESPONSE, 'CustomerResponse.java', '@Builder from Lombok on a record requires the annotation processor configured in the root POM.'),
      list([
        `The ${c('Customer')} / ${c('Product')} / ${c('Cart')} entity stays a class: it needs setters for JPA/Mongo and mutation in the cart domain.`,
        `${c('Item')} in cart is both an embedded document and the API body — a mix of layers, but it reduces files.`,
        `Feign in cart declares local ${c('CustomerResponse')} and ${c('ProductResponse')}, copies of the remote contract (they do not share the other module's record).`,
      ]),
    ),
  ),

  lombok: page(
    'Lombok',
    'Boilerplate generation at compile time. The root POM declares the optional dependency and configures annotationProcessorPaths on the maven-compiler-plugin.',
    section(
      'uso',
      'Annotations in the code',
      table(
        ['Annotation', 'Where'],
        [
          [`${c('@Data')} / ${c('@Builder')} / ${c('@NoArgsConstructor')}`, 'Mongo documents (Customer), several DTOs.'],
          [`${c('@Getter')} / ${c('@Setter')} (without @Data)`, 'JPA entities — avoids toString/hashCode on lazy collections.'],
          [`${c('@RequiredArgsConstructor')}`, `Controllers and services: injects the ${c('final')} fields.`],
          [`${c('@Slf4j')}`, `Handlers: ${c('log.warn')} / ${c('log.error')}.`],
          [`${c('@EqualsAndHashCode(callSuper = true)')}`, 'CustomerNotFoundException.'],
        ],
      ),
      tip('In the IDE, install the Lombok plugin. Without annotation processing, the project does not compile: the getters “do not exist” in the source.'),
    ),
  ),

  'variaveis-de-ambiente': page(
    'Environment variables (.env)',
    'Three layers: a .env file for Compose, environment: on the services, and ${...} placeholders in the Config Server YAMLs. Spring Boot does not read .env by itself.',
    section(
      'fluxo',
      'From .env to the property',
      list([
        `Compose interpolates ${c('${MONGO_DB_USERNAME}')} from the ${c('.env')} file.`,
        `The service receives, for example, ${c('SPRING_MONGODB_URI=mongodb://root:pass@mongodb:27017/customer_db?authSource=admin')}.`,
        `Relaxed binding: ${c('SPRING_MONGODB_URI')} becomes ${c('spring.mongodb.uri')}.`,
        `The Config Server YAML still has ${c('${SPRING_MONGODB_URI}')} — the client resolves it at startup.`,
      ]),
      code('ini', ENV_FILE, '.env'),
      note(
        `Property import (${c('spring.config.import')}) is the other configuration path: it is documented in ${link('/arquitetura/import-de-properties', 'Property import')}, next to the Config Server.`,
      ),
    ),
  ),
};
