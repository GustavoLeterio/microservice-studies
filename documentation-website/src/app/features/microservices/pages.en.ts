import { cards, code, columns, flow, list, note, page, section, table, tabs, text, tip, warn } from '../../shared/content/blocks';
import { c, link } from '../../shared/content/html';
import {
  CART_CONTROLLER,
  CART_SERVICE,
  CATEGORY_ENTITY,
  CUSTOMER_CLIENT,
  CUSTOMER_CONTROLLER,
  CUSTOMER_ENTITY,
  CUSTOMER_MAPPER,
  CUSTOMER_REPOSITORY,
  CUSTOMER_SERVICE,
  PRODUCT_CLIENT,
  PRODUCT_ENTITY,
} from '../../shared/content/snippets/java.snippets';

export const PAGES_EN = {
  conceito: page(
    'What they do and how they do it',
    'A microservice, in this project, is a Spring Boot process with its own database, its own POM, and its own container — talking to the others only over HTTP.',
    section(
      'o-que-e',
      'What a microservice is here',
      text(
        `Each business service packages a <strong>bounded context</strong>: customers, catalog, or cart. They do not share tables. They share only HTTP contracts, the ${c('common-exceptions')} JAR, and the platform (Config, Eureka, Gateway).`,
      ),
      table(
        ['Principle', 'How it shows up in the code'],
        [
          ['One process, one deploy', 'Maven module + Dockerfile + Compose service.'],
          ['Database per service', 'customer_db and cart_db on Mongo; product_db on Postgres. Same Mongo server, different logical databases.'],
          ['API as contract', `REST controllers under ${c('/api/v1/...')}; cart does not import customer classes, only a local ${c('CustomerResponse')} + Feign.`],
          ['Scale independence', `product and cart with no published port, ready for ${c('--scale')}.`],
        ],
      ),
    ),
    section(
      'como-faz',
      'How each one does its job',
      columns(
        {
          title: 'customer-microservice',
          blocks: [
            text('MongoDB CRUD. It calls nobody. It is called by the gateway and by the cart.'),
            list([`${c('CustomerController')} → ${c('CustomerService')} → ${c('CustomerRepository')}`, `Domain exception: ${c('CustomerNotFoundException')}`]),
          ],
        },
        {
          title: 'product-microservice',
          blocks: [
            text('Two JPA aggregates: Category and Product. Validates a unique category name and that the category exists when creating a product.'),
            list([`Two controllers (${c('/categories')}, ${c('/products')})`, '409 on a duplicate category in POST']),
          ],
        },
        {
          title: 'cart-microservice',
          blocks: [
            text('It orchestrates. Before writing, it asks customer whether the customer exists and product whether there is stock.'),
            list([`${c('@FeignClient')} + LoadBalancer`, `Cart document with ${c('_id = customerId')}`]),
          ],
        },
      ),
      tip(
        `Technologies, Maven dependencies, endpoints, and errors for each one are on the ${link('/explorador', 'Explorer')} profiles. This page covers the design; the profiles cover the contract.`,
      ),
    ),
    section(
      'criar',
      'Create a new service',
      text(
        `The full checklist (Maven module, YAML in the Config Server, gateway route, Compose, Prometheus scrape) is in ${link('/guias/novo-microservico', 'Create a new microservice')}.`,
      ),
    ),
  ),

  'camadas-mvc': page(
    'Layers (MVC)',
    'The three business services follow the same layering: Controller → Service → Repository, with a Mapper and records at the HTTP edge. This is not server-side view MVC — it is Spring\'s REST variation.',
    section(
      'pacote',
      'Package by feature',
      text(
        `Instead of ${c('controller/')}, ${c('service/')}, the code groups by feature: ${c('customer/')}, ${c('product/')}, ${c('cart/')}. Exceptions live in ${c('exceptions/')}.`,
      ),
      table(
        ['Layer', 'Typical annotation', 'Responsibility'],
        [
          ['Controller', `${c('@RestController')} + ${c('@RequestMapping')}`, `HTTP: status, path, ${c('@Valid')}. No business rule.`],
          ['Service', `${c('@Service')}`, 'Use cases, orchestration, throwing domain exceptions.'],
          ['Repository', `${c('MongoRepository')} / ${c('JpaRepository')}`, 'Data access. Interfaces, no implementation.'],
          ['Mapper', `${c('@Component')}`, 'Request → entity → Response. Isolates the persistence model from JSON.'],
          ['DTO', `${c('record')}`, 'HTTP contract. Request validates; Response only carries data.'],
        ],
      ),
    ),
    section(
      'fluxo',
      'Example: create a customer',
      flow([
        { label: 'POST /api/v1/customers', sub: 'JSON + @Valid', tone: 'external' },
        { label: 'CustomerController', sub: 'delegates' },
        { label: 'CustomerService', sub: 'save' },
        { label: 'CustomerMapper', sub: 'Request → Document' },
        { label: 'MongoDB', sub: 'customer_db', tone: 'data' },
      ]),
      tabs(
        { label: 'Controller', blocks: [code('java', CUSTOMER_CONTROLLER, 'CustomerController.java')] },
        { label: 'Service', blocks: [code('java', CUSTOMER_SERVICE, 'CustomerService.java')] },
        { label: 'Mapper', blocks: [code('java', CUSTOMER_MAPPER, 'CustomerMapper.java')] },
      ),
      note(
        `The controller's ${c('updateCustomer')} calls the service and ignores the return (${c('ResponseEntity.ok(...)')} without ${c('return')}), returning 202. The service itself works; the 200 from ${c('ok')} never goes out.`,
      ),
    ),
  ),

  persistencia: page(
    'Persistence',
    'Two styles in the same system: MongoDB documents (customer and cart) and JPA entities on PostgreSQL (product). Each service only sees its own database.',
    section(
      'mongo',
      'MongoDB (customer and cart)',
      text(
        `${c('@Document')} + ${c('MongoRepository<T, String>')}. The customer id is a generated ObjectId; the cart id is the ${c('customerId')} (the document is that customer's cart itself).`,
      ),
      tabs(
        { label: 'Customer', blocks: [code('java', CUSTOMER_ENTITY, 'Customer.java'), code('java', CUSTOMER_REPOSITORY, 'CustomerRepository.java')] },
        {
          label: 'Product (JPA)',
          blocks: [
            code('java', CATEGORY_ENTITY, 'Category.java'),
            code('java', PRODUCT_ENTITY, 'Product.java'),
            text(`Relationship ${c('@OneToMany')} / ${c('@ManyToOne')} with ${c('FetchType.LAZY')}. ${c('@Data')} was avoided on the entities precisely because of lazy loading.`),
          ],
        },
      ),
    ),
    section(
      'jpa',
      'PostgreSQL / JPA',
      list([
        `${c('ddl-auto: update')} — Hibernate creates/alters tables at startup. Fine for study, not for production.`,
        `Category name ${c('unique + nullable = false')}. POST handles a duplicate with 409; PUT does not, and it becomes a 500.`,
        `${c('findByCategoryId')} on ${c('ProductRepository')} feeds ${c('GET /api/v1/products/category/{id}')}.`,
      ]),
      warn(
        `Removing a category that still has products breaks the FK and falls into the catch-all 500 of ${c('GlobalExceptionHandler')}. See ${link('/guias/pontos-de-atencao', 'Points of attention')}.`,
      ),
    ),
  ),

  comunicacao: page(
    'Communication between services',
    'Only cart-microservice talks to other microservices. The call is synchronous, HTTP, declarative (OpenFeign), balanced on the client with Eureka instances.',
    section(
      'feign',
      'OpenFeign',
      text(
        `${c('@EnableFeignClients')} on the main class. Each client declares the <strong>Eureka name</strong> (uppercase, the way Eureka registers it) and the remote endpoint path.`,
      ),
      code('java', CUSTOMER_CLIENT, 'CustomerClient.java'),
      code('java', PRODUCT_CLIENT, 'ProductClient.java'),
      code('java', CART_SERVICE, 'CartService.java', 'Every mutation goes through validateIfCustomerExists / validateIfItemCanBePersisted.'),
    ),
    section(
      'lb',
      'LoadBalancer on the client',
      text(
        `The cart POM declares ${c('spring-cloud-starter-loadbalancer')}. In practice: Feign asks Eureka “who is CUSTOMER-MICROSERVICE?”, the LoadBalancer picks an instance (round-robin), and fires the HTTP call. That is ${link('/arquitetura/load-balancer', 'client-side')} balancing and ${link('/arquitetura/trafego', 'east-west')} traffic.`,
      ),
      flow(
        [
          { label: 'cart :8093' },
          { label: 'Feign', sub: 'CUSTOMER-MICROSERVICE', tone: 'platform' },
          { label: 'Eureka', tone: 'platform' },
          { label: 'customer :8091' },
        ],
        'The gateway does not take part in this call.',
      ),
    ),
    section(
      'falha',
      'When the other service fails',
      text(
        `A remote 404 becomes a ${c('FeignException')}, handled in ${c('CartExceptionHandler')} as 400 (not 404). A service that is down / has no Eureka instance tends toward a 503 from the LoadBalancer, also wrapped. Response body details are on the ${link('/explorador/servicos/cart-microservice', 'cart profile')}.`,
      ),
    ),
  ),

  endpoints: page(
    'Endpoints',
    'REST conventions used by the three services and the gateway. The full list, with response and error examples, is in the catalog.',
    section(
      'convencoes',
      'Conventions',
      list([
        `Prefix ${c('/api/v1/')} + resource in the plural.`,
        `JSON for almost everything. Exception: customer POST returns the id as ${c('text/plain')}.`,
        'Ids: String (Mongo) on customer/cart; Integer (JPA) on product/category.',
        'The gateway replicates the same paths — the external client does not need to know the internal host.',
      ]),
      table(
        ['Service', 'Base', 'Via gateway'],
        [
          ['customer', `${c('/api/v1/customers')}`, 'http://localhost:8222/api/v1/customers'],
          ['product', `${c('/api/v1/products')} and ${c('/api/v1/categories')}`, 'http://localhost:8222/api/v1/products'],
          ['cart', `${c('/api/v1/carts/{customerId}')}`, 'http://localhost:8222/api/v1/carts/{id}'],
        ],
      ),
      cards([
        {
          title: 'Filterable catalog',
          link: '/explorador/endpoints',
          html: 'Every business route with body, responses, and errors.',
        },
        {
          title: 'Aggregated Swagger',
          link: '/observabilidade/swagger-no-gateway',
          html: 'UI at http://localhost:8222/swagger-ui.html.',
        },
      ]),
    ),
    section(
      'cart',
      'Cart detail',
      text(
        `Item mutations use ${c('PATCH')} (empty, change, remove) and ${c('POST .../items/add')}. There is no DELETE for an item: removal is a patch on the cart resource. ${c('GET')} creates the empty cart if it does not exist yet.`,
      ),
      code('java', CART_CONTROLLER, 'CartController.java'),
    ),
  ),

  'respostas-e-erros': page(
    'Responses and errors',
    'Two formats live side by side: the internal lib\'s ErrorResponse record (customer/product) and ProblemDetail / Boot\'s default error (cart and some routes).',
    section(
      'sucesso',
      'Success',
      table(
        ['Case', 'Typical status', 'Body'],
        [
          ['GET list/item', '200', 'Response JSON / Cart entity'],
          ['POST customer', '200', 'id as text'],
          ['POST product/category', '200', 'numeric id'],
          ['PUT customer', '202 Accepted', 'empty'],
          ['DELETE customer', '202', 'empty'],
          ['DELETE product/category', '200', 'empty'],
        ],
      ),
    ),
    section(
      'error-response',
      'ErrorResponse (customer and product)',
      text(`Inherited from ${link('/codigo/common-exceptions', 'common-exceptions')}:`),
      code(
        'json',
        `{
  "errors": { "email": "Invalid email address" },
  "timestamp": "2026-10-08T12:00:00.000",
  "path": "/"
}`,
      ),
      list([
        `400 validation (${c('MethodArgumentNotValidException')}) — one item per field.`,
        `400 missing body — ${c('{ "error": "Request body is missing" }')}.`,
        `Domain 404 — key ${c('customer')}, ${c('product')}, or ${c('category')}.`,
        '409 duplicate category.',
        `500 catch-all — also swallows a missing-route 404 and a 405. See ${link('/codigo/captura-de-exceptions', 'Exception handling')}.`,
      ]),
    ),
    section(
      'cart-erros',
      'Cart',
      text(
        `${c('CartExceptionHandler')} extends ${c('ResponseEntityExceptionHandler')} (not GlobalExceptionHandler). Feign becomes 400. ${c('CartException')} uses the status it carries itself (400 or 404). ${c('Item')} validation comes out as ProblemDetail.`,
      ),
      warn(
        `${c('List.of()')} on a newly created cart leaves the list immutable. The first ${c('addItem')} throws ${c('UnsupportedOperationException')} and Boot responds 500 through ${c('/error')}.`,
      ),
    ),
  ),
};
