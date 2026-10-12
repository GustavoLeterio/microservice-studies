import { CART_APPLICATION_YML, CART_CONFIG_YML } from '../../content/snippets/config.snippets';
import { COMPOSE_CART } from '../../content/snippets/docker.snippets';
import { CART_POM } from '../../content/snippets/maven.snippets';
import { BodyField, EndpointError, ServiceInfo } from '../../models/system.models';
import { COMMON_EXCEPTIONS_DEPENDENCY_EN, FROM_MICROSERVICES_EN, FROM_ROOT_EN } from './dependencies.en';
import {
  CUSTOMER_ID,
  cartBodyMissingError,
  cartValidationError,
  errorResponse,
  feignError,
  json,
  problemDetail,
  springBootError,
} from './examples.en';

const BASE = 'microservices/cart-microservice/src/main/java/com/gustavoleterio/microservices/cart_microservice';
const CART_PATH = `/api/v1/carts/${CUSTOMER_ID}`;

const cartWith = (...items: { productId: number; quantity: number }[]) => json({ customerId: CUSTOMER_ID, items });

const itemFields: BodyField[] = [
  { name: 'productId', type: 'Integer', required: true, rules: '@NotNull → "Product ID is required"' },
  {
    name: 'quantity',
    type: 'Integer',
    required: true,
    rules: '@NotNull → "Quantity is required" · @Min(1) → "Quantity must be greater than or equal to 1"',
  },
];

const customerParam = {
  name: 'customerId',
  in: 'path' as const,
  type: 'String',
  description: 'Customer id in customer-microservice. It is also the cart _id in MongoDB.',
};

const stockError: EndpointError = {
  status: 400,
  cause: 'quantity greater than the stock reported by product-microservice.',
  source: 'CartException(BAD_REQUEST) → CartExceptionHandler.handleCartException',
  example: errorResponse({ error: 'Product stock is not enough for product with id: 1' }, '/api/v1/carts'),
};

const customerFeign = feignError('customer', CUSTOMER_ID);
const productFeign = feignError('product', '99');

export const CART_SERVICE_EN: ServiceInfo = {
  id: 'cart-microservice',
  name: 'cart-microservice',
  kind: 'negocio',
  tagline: 'Shopping cart in MongoDB, validated against customers and products via OpenFeign.',
  description:
    'Keeps one cart per customer (the document id is the customerId itself). It is the only service that talks to other microservices: before changing the cart, it calls customer-microservice and product-microservice using declarative OpenFeign clients, load-balanced by Spring Cloud LoadBalancer with instances discovered in Eureka.',
  responsibilities: [
    "Get or create a customer's cart.",
    'Add items, change quantities, remove items, and empty the cart.',
    'Ensure the customer and the product exist and that there is enough stock.',
  ],
  port: '8093',
  access:
    'Only through the gateway at http://localhost:8222/api/v1/carts/{customerId} (port not published; the service can have several replicas).',
  database: 'MongoDB · database cart_db · collection cart',
  image: 'Local build: microservices/cart-microservice/Dockerfile (multi-stage, eclipse-temurin:25 JDK → JRE alpine)',
  technologies: [
    'Java 25',
    'Spring Boot 4.1.1',
    'Spring Web MVC',
    'Spring Data MongoDB',
    'Spring Cloud OpenFeign',
    'Spring Cloud LoadBalancer',
    'Bean Validation',
    'Spring Cloud Config Client',
    'Eureka Client',
    'springdoc-openapi',
    'Actuator + Micrometer',
    'Lombok',
  ],
  dependencies: [
    {
      artifact: 'spring-boot-starter-data-mongodb',
      scope: 'compile',
      origin: 'Declared in the service POM',
      purpose: 'Cart persistence in MongoDB.',
    },
    {
      artifact: 'spring-cloud-starter-openfeign',
      scope: 'compile',
      origin: 'Declared in the service POM',
      purpose: 'Declarative HTTP clients (@FeignClient) for customer and product.',
    },
    {
      artifact: 'spring-cloud-starter-loadbalancer',
      scope: 'compile',
      origin: 'Declared in the service POM',
      purpose: 'Client-side load balancing: picks an instance registered in Eureka on each call.',
    },
    COMMON_EXCEPTIONS_DEPENDENCY_EN,
    {
      artifact: 'spring-boot-starter-data-mongodb-test',
      scope: 'test',
      origin: 'Declared in the service POM',
      purpose: 'Test support for the MongoDB data layer.',
    },
    ...FROM_MICROSERVICES_EN,
    ...FROM_ROOT_EN,
  ],
  relations: [
    {
      label: 'Depends on',
      targets: ['mongodb', 'customer-microservice', 'product-microservice', 'config-server', 'discovery-server', 'common-exceptions'],
    },
    { label: 'Called by', targets: ['api-gateway'] },
    { label: 'Monitored by', targets: ['prometheus'] },
  ],
  endpointGroups: [
    {
      title: 'Cart',
      basePath: '/api/v1/carts/{customerId}',
      description:
        'CartController. Every route validates the customer against customer-microservice (Feign) and returns the updated cart.',
      endpoints: [
        {
          id: 'carts-get',
          method: 'GET',
          path: '/api/v1/carts/{customerId}',
          summary: "Gets the customer's cart, creating an empty one if it does not exist yet.",
          handler: 'CartController.getOrCreateCart → CartService.getOrCreateCart',
          params: [customerParam],
          responses: [
            { status: 200, description: 'Cart (existing or just created).', contentType: 'application/json', example: cartWith({ productId: 1, quantity: 2 }) },
          ],
          errors: [customerFeign],
        },
        {
          id: 'carts-empty',
          method: 'PATCH',
          path: '/api/v1/carts/{customerId}/empty',
          summary: 'Empties the cart.',
          handler: 'CartController.emptyCart → CartService.emptyCart',
          params: [customerParam],
          responses: [{ status: 200, description: 'Cart with no items.', contentType: 'application/json', example: cartWith() }],
          errors: [customerFeign],
        },
        {
          id: 'carts-add-item',
          method: 'POST',
          path: '/api/v1/carts/{customerId}/items/add',
          summary: 'Adds a product to the cart.',
          description:
            'Validates the customer and the product via Feign and checks stock. If the product is already in the cart, the quantity is not added: the request is rejected.',
          handler: 'CartController.addItemToCart → CartService.addItemToCart → Cart.addItem',
          params: [customerParam],
          body: { type: 'Item', fields: itemFields, example: json({ productId: 1, quantity: 2 }) },
          responses: [
            { status: 200, description: 'Cart with the new item.', contentType: 'application/json', example: cartWith({ productId: 1, quantity: 2 }) },
          ],
          errors: [
            cartValidationError(`${CART_PATH}/items/add`),
            cartBodyMissingError(`${CART_PATH}/items/add`),
            customerFeign,
            productFeign,
            stockError,
            {
              status: 400,
              cause: 'The product is already in the cart (use /items/change to change the quantity).',
              source: 'CartException(BAD_REQUEST) → CartExceptionHandler.handleCartException',
              example: errorResponse(
                {
                  error:
                    'Item already exists in cart with product id: 1. Use /{customerId}/items/{productId} to change the item quantity. ',
                },
                '/api/v1/carts',
              ),
            },
            {
              status: 500,
              cause:
                'First item of a cart that did not exist yet: the cart is created with List.of() (immutable) and add() throws UnsupportedOperationException. With no handler for it, Spring Boot responds through /error.',
              source: 'UnsupportedOperationException → BasicErrorController',
              example: springBootError(500, 'Internal Server Error', `${CART_PATH}/items/add`),
            },
          ],
        },
        {
          id: 'carts-change-item',
          method: 'PATCH',
          path: '/api/v1/carts/{customerId}/items/change',
          summary: 'Changes the quantity of a product already in the cart.',
          handler: 'CartController.changeItemQuantityFromCart → CartService.changeItemQuantityFromCart → Cart.changeItemQuantityFromCart',
          params: [customerParam],
          body: { type: 'Item', fields: itemFields, example: json({ productId: 1, quantity: 5 }) },
          responses: [
            { status: 200, description: 'Cart with the updated quantity.', contentType: 'application/json', example: cartWith({ productId: 1, quantity: 5 }) },
          ],
          errors: [
            cartValidationError(`${CART_PATH}/items/change`),
            customerFeign,
            productFeign,
            stockError,
            {
              status: 404,
              cause: 'The product is not in the cart.',
              source: 'CartException(NOT_FOUND) → CartExceptionHandler.handleCartException',
              example: errorResponse({ error: 'Item not found in cart with product id: 3' }, '/api/v1/carts'),
            },
          ],
        },
        {
          id: 'carts-remove-item',
          method: 'PATCH',
          path: '/api/v1/carts/{customerId}/items/remove/{productId}',
          summary: 'Removes a product from the cart.',
          description: 'If the product is not in the cart, nothing happens and the cart is returned as it is.',
          handler: 'CartController.removeItemFromCart → CartService.removeItemFromCart → Cart.removeItem',
          params: [customerParam, { name: 'productId', in: 'path', type: 'Integer', description: 'Id of the product to remove.' }],
          responses: [{ status: 200, description: 'Cart without the item.', contentType: 'application/json', example: cartWith() }],
          errors: [
            customerFeign,
            {
              status: 400,
              cause: 'productId is not numeric. Here ResponseEntityExceptionHandler handles TypeMismatchException.',
              source: 'MethodArgumentTypeMismatchException → ResponseEntityExceptionHandler',
              example: problemDetail(400, 'Bad Request', "Failed to convert 'productId' with value: 'abc'", `${CART_PATH}/items/remove/abc`),
            },
          ],
        },
      ],
    },
  ],
  exceptions: [
    {
      name: 'FeignException',
      status: '400 Bad Request',
      when: 'Any error response from customer/product (including 404) or an unavailable service (503 from the LoadBalancer).',
      handler: 'CartExceptionHandler.handleFeignException',
    },
    {
      name: 'CartException',
      status: 'Defined on the exception (400 or 404)',
      when: 'Insufficient stock, duplicate item (400), or item missing from the cart (404).',
      handler: 'CartExceptionHandler.handleCartException',
    },
    {
      name: 'CustomerNotFoundException / ProductNotFoundException',
      status: '404 Not Found',
      when: 'When Feign returns an empty Optional. This almost never happens today, because the remote 404 becomes a FeignException.',
      handler: 'CartExceptionHandler',
    },
    {
      name: 'Spring MVC exceptions',
      status: '400, 404, 405... (ProblemDetail)',
      when: 'Validation, unreadable body, invalid type, unknown route or method.',
      handler: 'ResponseEntityExceptionHandler (base class)',
    },
    {
      name: 'Other exceptions',
      status: '500 Internal Server Error',
      when: 'No handler: Spring Boot responds through /error (BasicErrorController).',
      handler: '—',
    },
  ],
  config: [
    { language: 'yaml', code: CART_APPLICATION_YML, file: 'microservices/cart-microservice/src/main/resources/application.yml' },
    {
      language: 'yaml',
      code: CART_CONFIG_YML,
      file: 'config-server/src/main/resources/config/cart-microservice.yml',
      caption: 'Note that the log file and the log level point at customer (likely a copy-paste).',
    },
    { language: 'yaml', code: COMPOSE_CART, file: 'docker-compose.yml' },
    { language: 'xml', code: CART_POM, file: 'microservices/cart-microservice/pom.xml' },
  ],
  env: [
    { name: 'SPRING_CONFIG_IMPORT', value: 'configserver:http://config-server:8888', purpose: 'Config Server address.' },
    { name: 'EUREKA_DEFAULT_ZONE', value: 'http://discovery-server:8761/eureka', purpose: 'Eureka address.' },
    {
      name: 'SPRING_MONGODB_URI',
      value: 'mongodb://root:pass@mongodb:27017/cart_db?authSource=admin',
      purpose: 'MongoDB connection (cart_db database).',
    },
  ],
  links: [
    { label: 'Swagger (via gateway)', url: 'http://localhost:8222/swagger-ui.html' },
    { label: 'OpenAPI via gateway', url: 'http://localhost:8222/v3/api-docs/cart' },
  ],
  sourceFiles: [
    { path: `${BASE}/CartMicroserviceApplication.java`, role: 'Main class with @EnableFeignClients.' },
    { path: `${BASE}/cart/CartController.java`, role: 'Routes /api/v1/carts/{customerId}.' },
    { path: `${BASE}/cart/CartService.java`, role: 'Orchestrates remote validation and persistence.' },
    { path: `${BASE}/cart/Cart.java`, role: 'Cart document with item rules.' },
    { path: `${BASE}/item/Item.java`, role: 'Cart item (also used as the request body).' },
    { path: `${BASE}/customer/CustomerClient.java`, role: '@FeignClient for customer-microservice.' },
    { path: `${BASE}/product/ProductClient.java`, role: '@FeignClient for product-microservice.' },
    { path: `${BASE}/exceptions/CartExceptionHandler.java`, role: 'Advice that extends ResponseEntityExceptionHandler.' },
  ],
  docs: [
    { label: 'Communication between services', path: '/microservicos/comunicacao' },
    { label: 'East-west traffic', path: '/arquitetura/trafego' },
    { label: 'Points of attention', path: '/guias/pontos-de-atencao' },
  ],
};
