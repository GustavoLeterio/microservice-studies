# 🇮🇪 E-commerce Microservices

A study of an e-commerce system split into microservices: customers, products, and cart, with centralized configuration, service discovery, an API Gateway, metrics, and dashboards.

**Documentation:** [microservice-documentation.netlify.app](https://microservice-documentation.netlify.app)

## Domain

The system models a small store, with **one database per service** and a clear responsibility in each process. The client does not talk to the database or to a microservice directly: the edge is the gateway, and each service only knows its own model.

- **customer-microservice** (port `8091`) persists customers in **MongoDB**, in the `customer_db` database
- **product-microservice** (port `8092`) persists the catalog in **PostgreSQL** with **JPA/Hibernate**, in the `product_db` database
- **cart-microservice** (port `8093`) persists the cart in **MongoDB**, in the `cart_db` database, and looks up the customer and the product before building the order

The choice of two databases is intentional. Customers and carts are documents, with a flexible structure. Products are relational, with an entity, a Spring Data repository, and a schema managed by JPA. The cart does not copy those records: it stores references and fetches the rest at request time.

That lookup leaves `cart-microservice` through **OpenFeign**. The Feign client uses the service's logical name, **Spring Cloud LoadBalancer** picks an instance, and **Eureka** reports who is up. There is no fixed URL between services. If more than one replica exists, client-side balancing spreads the calls.

## Traffic and platform

The path of an external request is short. The client calls the **API Gateway** on port `8222`. The gateway, built with Spring Cloud Gateway, applies predicates and filters and forwards with the `lb://` scheme to customer, product, or cart. That is **north-south** traffic. The gateway's **Swagger UI** merges the OpenAPI specification of all three, so the route documentation lives at a single address.

The internal path is the opposite. When the cart needs a customer or a product, the call is **east-west**: service to service, by the registered name, without going through the gateway again.

| Piece | Port | Role |
|---|---|---|
| **API Gateway** | `8222` | North-south entry and `lb://` routes |
| **Config Server** | `8888` | One YAML per application, `native` profile |
| **Eureka** | `8761` | Registration, heartbeat, and discovery |
| **OpenFeign** | — | East-west calls starting from the cart |

Config Server and Eureka stay outside the business flow. The Config Server keeps configuration in a local file, and each application imports it with `spring.config.import`. The discovery server receives the registration at startup and the heartbeat while the process is alive. Port, database name, user, and password are not hardcoded in YAML: they enter as placeholders and are filled by the Compose `.env`.

## Code

The repository is a **multi-module** Maven build on **Java 25**, **Spring Boot 4.1**, and **Spring Cloud 2025.1**. The parent POM, `ecommerce`, aggregates `config-server`, `discovery-server`, `api-gateway`, and `microservices`. It imports the Spring Cloud BOM in `dependencyManagement` and shares **Actuator**, **Micrometer** (Prometheus registry), and **Lombok**. Each child module points at that parent and declares only what is specific to it.

Inside `microservices` there are four modules. The three business services follow the same layers: **controller**, **service**, **repository**, **mapper**, and **DTO**. The fourth, `common-exceptions`, is an internal library. It does not run as a process. The services consume it as a JAR and inherit the error handling: `@RestControllerAdvice`, handlers, and **ProblemDetail**, so that 404, validation, and unexpected failures share the same format.

HTTP contracts use Java **records**. Request and response are immutable and stay separate from the persistence entity. The mapper translates one into the other. That way the Mongo document or the JPA entity does not leak to the API client.

## Runtime

**Docker Compose** brings up the `microservices` network and ties startup order to healthchecks.

- **MongoDB** (`27017`) and **PostgreSQL** (`5432`) use a named volume; data survives `docker compose down` without `-v`
- **Config Server** and **Eureka** expose `/actuator/health`; the gateway waits until both are healthy
- Customer waits for Mongo, config, and discovery; product waits for Postgres, config, and discovery; cart waits for Mongo, config, and discovery
- Java images are **multi-stage**: the first stage compiles with the JDK, the second runs with the Alpine JRE
- Application logs go to a bind mount, under `logs/` inside each microservice
- **Prometheus** (`9090`) scrapes Micrometer metrics; **Grafana** (`3000`) uses that datasource in the dashboards

`.env` stays out of Git. The repository publishes `.env.example`, with the same keys and study values, so anyone cloning the project knows which variables Compose expects.

## Documentation

The site in `documentation-website` is an **Angular 22** SPA with NgModules and Sass. The sidebar follows a reading path: overview, service and endpoint explorer, microservices, Java code structure, Spring Cloud architecture, Docker, observability, and guides. The code excerpts come from the repository's real files. The published version is at [microservice-documentation.netlify.app](https://microservice-documentation.netlify.app).

---

# 🇧🇷 E-commerce Microservices

Estudo de um e-commerce dividido em microserviços: clientes, produtos e carrinho, com configuração centralizada, descoberta de serviços, API Gateway, métricas e dashboards.

**Documentação:** [microservice-documentation.netlify.app](https://microservice-documentation.netlify.app)

## Domínio

O sistema modela um comércio pequeno, com **um banco por serviço** e uma responsabilidade clara em cada processo. O cliente não fala com o banco nem com o microsserviço direto: a borda é o gateway, e cada serviço só conhece o próprio modelo.

- **customer-microservice** (porta `8091`) persiste clientes no **MongoDB**, no banco `customer_db`
- **product-microservice** (porta `8092`) persiste o catálogo no **PostgreSQL** com **JPA/Hibernate**, no banco `product_db`
- **cart-microservice** (porta `8093`) persiste o carrinho no **MongoDB**, no banco `cart_db`, e consulta cliente e produto antes de montar o pedido

A escolha de dois bancos é proposital. Cliente e carrinho são documentos, com estrutura flexível. Produto é relacional, com entidade, repositório Spring Data e schema gerido pelo JPA. O carrinho não duplica esses cadastros: ele guarda referências e busca o restante na hora.

Essa busca sai do `cart-microservice` por **OpenFeign**. O cliente Feign usa o nome lógico do serviço, o **Spring Cloud LoadBalancer** escolhe uma instância e o **Eureka** informa quem está no ar. Não há URL fixa entre os serviços. Se existir mais de uma réplica, o balanceamento do lado cliente distribui as chamadas.

## Tráfego e plataforma

O caminho de uma requisição externa é curto. O cliente chama o **API Gateway** na porta `8222`. O gateway, feito com Spring Cloud Gateway, aplica predicados e filtros e encaminha com o esquema `lb://` para customer, product ou cart. Esse é o tráfego **norte-sul**. O **Swagger UI** do gateway junta a especificação OpenAPI dos três, então a documentação das rotas fica em um único endereço.

O caminho interno é o oposto. Quando o carrinho precisa de um cliente ou de um produto, a chamada é **leste-oeste**: serviço para serviço, pelo nome registrado, sem passar de novo pelo gateway.

| Peça | Porta | Papel |
|---|---|---|
| **API Gateway** | `8222` | Entrada norte-sul e rotas `lb://` |
| **Config Server** | `8888` | Um YAML por aplicação, perfil `native` |
| **Eureka** | `8761` | Registro, heartbeat e descoberta |
| **OpenFeign** | — | Chamada leste-oeste a partir do carrinho |

Config Server e Eureka ficam fora do fluxo de negócio. O Config Server guarda a configuração em arquivo local e cada aplicação a importa com `spring.config.import`. O discovery-server recebe o registro na subida e o heartbeat enquanto o processo vive. Porta, nome de banco, usuário e senha não ficam cravados no YAML: entram como placeholder e são preenchidos pelo `.env` do Compose.

## Código

O repositório é um Maven **multi-módulo** em **Java 25**, **Spring Boot 4.1** e **Spring Cloud 2025.1**. O POM pai, `ecommerce`, agrega `config-server`, `discovery-server`, `api-gateway` e `microservices`. Ele importa o BOM do Spring Cloud em `dependencyManagement` e compartilha **Actuator**, **Micrometer** (registry Prometheus) e **Lombok**. Cada módulo filho aponta para esse pai e declara só o que é específico dele.

Dentro de `microservices` há quatro módulos. Os três serviços de negócio seguem as mesmas camadas: **controller**, **service**, **repository**, **mapper** e **DTO**. O quarto, `common-exceptions`, é uma biblioteca interna. Ela não sobe como processo. Os serviços a consomem como JAR e herdam o tratamento de erro: `@RestControllerAdvice`, handlers e **ProblemDetail**, para que 404, validação e falha inesperada tenham o mesmo formato.

Os contratos HTTP usam **records** Java. Request e response são imutáveis e ficam separados da entidade de persistência. O mapper traduz um no outro. Assim o documento do Mongo ou a entidade JPA não vaza para o cliente da API.

## Execução

O **Docker Compose** sobe a rede `microservices` e amarra a ordem de início com healthcheck.

- **MongoDB** (`27017`) e **PostgreSQL** (`5432`) usam volume nomeado; o dado sobrevive a `docker compose down` sem `-v`
- **Config Server** e **Eureka** expõem `/actuator/health`; o gateway espera os dois saudáveis
- Customer espera Mongo, config e discovery; product espera Postgres, config e discovery; cart espera Mongo, config e discovery
- As imagens Java são **multi-stage**: o primeiro estágio compila com o JDK, o segundo executa com o JRE Alpine
- Logs da aplicação saem em bind mount, em `logs/` dentro de cada microsserviço
- **Prometheus** (`9090`) raspa as métricas do Micrometer; **Grafana** (`3000`) usa esse datasource nos dashboards

O `.env` fica de fora do Git. O repositório publica o `.env.example`, com as mesmas chaves e valores de estudo, para quem clonar saber quais variáveis o Compose espera.

## Documentação

O site em `documentation-website` é uma SPA **Angular 22** com NgModules e Sass. A sidebar segue um caminho de leitura: visão geral, explorador de serviços e endpoints, microserviços, estrutura do código Java, arquitetura Spring Cloud, Docker, observabilidade e guias. Os trechos de código vêm dos arquivos reais do repositório. A versão publicada está em [microservice-documentation.netlify.app](https://microservice-documentation.netlify.app).
