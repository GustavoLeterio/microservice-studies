import { CART_APPLICATION_YML, CART_CONFIG_YML } from '../../content/snippets/config.snippets';
import { COMPOSE_CART } from '../../content/snippets/docker.snippets';
import { CART_POM } from '../../content/snippets/maven.snippets';
import { BodyField, EndpointError, ServiceInfo } from '../../models/system.models';
import { COMMON_EXCEPTIONS_DEPENDENCY, FROM_MICROSERVICES, FROM_ROOT } from './dependencies.data';
import {
  CUSTOMER_ID,
  cartBodyMissingError,
  cartValidationError,
  errorResponse,
  feignError,
  json,
  problemDetail,
  springBootError,
} from './examples';

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
  description: 'Id do cliente no customer-microservice. Também é o _id do carrinho no MongoDB.',
};

const stockError: EndpointError = {
  status: 400,
  cause: 'quantity maior que o estoque informado pelo product-microservice.',
  source: 'CartException(BAD_REQUEST) → CartExceptionHandler.handleCartException',
  example: errorResponse({ error: 'Product stock is not enough for product with id: 1' }, '/api/v1/carts'),
};

const customerFeign = feignError('customer', CUSTOMER_ID);
const productFeign = feignError('product', '99');

export const CART_SERVICE: ServiceInfo = {
  id: 'cart-microservice',
  name: 'cart-microservice',
  kind: 'negocio',
  tagline: 'Carrinho de compras no MongoDB, validado contra clientes e produtos via OpenFeign.',
  description:
    'Mantém um carrinho por cliente (o id do documento é o próprio customerId). É o único serviço que conversa com outros microserviços: antes de alterar o carrinho, consulta o customer-microservice e o product-microservice usando clientes declarativos OpenFeign, balanceados pelo Spring Cloud LoadBalancer com instâncias descobertas no Eureka.',
  responsibilities: [
    'Obter ou criar o carrinho de um cliente.',
    'Adicionar itens, alterar quantidades, remover itens e esvaziar o carrinho.',
    'Garantir que o cliente e o produto existem e que há estoque suficiente.',
  ],
  port: '8093',
  access:
    'Somente pelo gateway em http://localhost:8222/api/v1/carts/{customerId} (porta não publicada; o serviço pode ter várias réplicas).',
  database: 'MongoDB · banco cart_db · coleção cart',
  image: 'Build local: microservices/cart-microservice/Dockerfile (multi-stage, eclipse-temurin:25 JDK → JRE alpine)',
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
      origin: 'Declarada no POM do serviço',
      purpose: 'Persistência do carrinho no MongoDB.',
    },
    {
      artifact: 'spring-cloud-starter-openfeign',
      scope: 'compile',
      origin: 'Declarada no POM do serviço',
      purpose: 'Clientes HTTP declarativos (@FeignClient) para customer e product.',
    },
    {
      artifact: 'spring-cloud-starter-loadbalancer',
      scope: 'compile',
      origin: 'Declarada no POM do serviço',
      purpose: 'Balanceamento client-side: escolhe uma instância registrada no Eureka a cada chamada.',
    },
    COMMON_EXCEPTIONS_DEPENDENCY,
    {
      artifact: 'spring-boot-starter-data-mongodb-test',
      scope: 'test',
      origin: 'Declarada no POM do serviço',
      purpose: 'Suporte a testes da camada de dados MongoDB.',
    },
    ...FROM_MICROSERVICES,
    ...FROM_ROOT,
  ],
  relations: [
    {
      label: 'Depende de',
      targets: ['mongodb', 'customer-microservice', 'product-microservice', 'config-server', 'discovery-server', 'common-exceptions'],
    },
    { label: 'É chamado por', targets: ['api-gateway'] },
    { label: 'Monitorado por', targets: ['prometheus'] },
  ],
  endpointGroups: [
    {
      title: 'Carrinho',
      basePath: '/api/v1/carts/{customerId}',
      description:
        'CartController. Todas as rotas validam o cliente no customer-microservice (Feign) e devolvem o carrinho atualizado.',
      endpoints: [
        {
          id: 'carts-get',
          method: 'GET',
          path: '/api/v1/carts/{customerId}',
          summary: 'Obtém o carrinho do cliente, criando um vazio se ainda não existir.',
          handler: 'CartController.getOrCreateCart → CartService.getOrCreateCart',
          params: [customerParam],
          responses: [
            { status: 200, description: 'Carrinho (existente ou recém-criado).', contentType: 'application/json', example: cartWith({ productId: 1, quantity: 2 }) },
          ],
          errors: [customerFeign],
        },
        {
          id: 'carts-empty',
          method: 'PATCH',
          path: '/api/v1/carts/{customerId}/empty',
          summary: 'Esvazia o carrinho.',
          handler: 'CartController.emptyCart → CartService.emptyCart',
          params: [customerParam],
          responses: [{ status: 200, description: 'Carrinho sem itens.', contentType: 'application/json', example: cartWith() }],
          errors: [customerFeign],
        },
        {
          id: 'carts-add-item',
          method: 'POST',
          path: '/api/v1/carts/{customerId}/items/add',
          summary: 'Adiciona um produto ao carrinho.',
          description:
            'Valida cliente e produto via Feign e confere o estoque. Se o produto já estiver no carrinho, a quantidade não é somada: a requisição é recusada.',
          handler: 'CartController.addItemToCart → CartService.addItemToCart → Cart.addItem',
          params: [customerParam],
          body: { type: 'Item', fields: itemFields, example: json({ productId: 1, quantity: 2 }) },
          responses: [
            { status: 200, description: 'Carrinho com o novo item.', contentType: 'application/json', example: cartWith({ productId: 1, quantity: 2 }) },
          ],
          errors: [
            cartValidationError(`${CART_PATH}/items/add`),
            cartBodyMissingError(`${CART_PATH}/items/add`),
            customerFeign,
            productFeign,
            stockError,
            {
              status: 400,
              cause: 'O produto já está no carrinho (use /items/change para alterar a quantidade).',
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
                'Primeiro item de um carrinho que ainda não existia: o carrinho é criado com List.of() (imutável) e o add() lança UnsupportedOperationException. Sem handler para ela, o Spring Boot responde pelo /error.',
              source: 'UnsupportedOperationException → BasicErrorController',
              example: springBootError(500, 'Internal Server Error', `${CART_PATH}/items/add`),
            },
          ],
        },
        {
          id: 'carts-change-item',
          method: 'PATCH',
          path: '/api/v1/carts/{customerId}/items/change',
          summary: 'Altera a quantidade de um produto que já está no carrinho.',
          handler: 'CartController.changeItemQuantityFromCart → CartService.changeItemQuantityFromCart → Cart.changeItemQuantityFromCart',
          params: [customerParam],
          body: { type: 'Item', fields: itemFields, example: json({ productId: 1, quantity: 5 }) },
          responses: [
            { status: 200, description: 'Carrinho com a quantidade atualizada.', contentType: 'application/json', example: cartWith({ productId: 1, quantity: 5 }) },
          ],
          errors: [
            cartValidationError(`${CART_PATH}/items/change`),
            customerFeign,
            productFeign,
            stockError,
            {
              status: 404,
              cause: 'O produto não está no carrinho.',
              source: 'CartException(NOT_FOUND) → CartExceptionHandler.handleCartException',
              example: errorResponse({ error: 'Item not found in cart with product id: 3' }, '/api/v1/carts'),
            },
          ],
        },
        {
          id: 'carts-remove-item',
          method: 'PATCH',
          path: '/api/v1/carts/{customerId}/items/remove/{productId}',
          summary: 'Remove um produto do carrinho.',
          description: 'Se o produto não estiver no carrinho, nada acontece e o carrinho é devolvido como está.',
          handler: 'CartController.removeItemFromCart → CartService.removeItemFromCart → Cart.removeItem',
          params: [customerParam, { name: 'productId', in: 'path', type: 'Integer', description: 'Id do produto a remover.' }],
          responses: [{ status: 200, description: 'Carrinho sem o item.', contentType: 'application/json', example: cartWith() }],
          errors: [
            customerFeign,
            {
              status: 400,
              cause: 'productId não numérico. Aqui o ResponseEntityExceptionHandler trata o TypeMismatchException.',
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
      when: 'Qualquer resposta de erro do customer/product (inclusive 404) ou serviço indisponível (503 do LoadBalancer).',
      handler: 'CartExceptionHandler.handleFeignException',
    },
    {
      name: 'CartException',
      status: 'Definido na exceção (400 ou 404)',
      when: 'Estoque insuficiente, item duplicado (400) ou item ausente no carrinho (404).',
      handler: 'CartExceptionHandler.handleCartException',
    },
    {
      name: 'CustomerNotFoundException / ProductNotFoundException',
      status: '404 Not Found',
      when: 'Quando o Feign devolve Optional vazio. Hoje praticamente não ocorre, porque o 404 remoto vira FeignException.',
      handler: 'CartExceptionHandler',
    },
    {
      name: 'Exceções do Spring MVC',
      status: '400, 404, 405... (ProblemDetail)',
      when: 'Validação, corpo ilegível, tipo inválido, rota ou método inexistente.',
      handler: 'ResponseEntityExceptionHandler (classe base)',
    },
    {
      name: 'Demais exceções',
      status: '500 Internal Server Error',
      when: 'Sem handler: o Spring Boot responde pelo /error (BasicErrorController).',
      handler: '—',
    },
  ],
  config: [
    { language: 'yaml', code: CART_APPLICATION_YML, file: 'microservices/cart-microservice/src/main/resources/application.yml' },
    {
      language: 'yaml',
      code: CART_CONFIG_YML,
      file: 'config-server/src/main/resources/config/cart-microservice.yml',
      caption: 'Repare que o arquivo de log e o nível de log apontam para o customer (provável cópia).',
    },
    { language: 'yaml', code: COMPOSE_CART, file: 'docker-compose.yml' },
    { language: 'xml', code: CART_POM, file: 'microservices/cart-microservice/pom.xml' },
  ],
  env: [
    { name: 'SPRING_CONFIG_IMPORT', value: 'configserver:http://config-server:8888', purpose: 'Endereço do Config Server.' },
    { name: 'EUREKA_DEFAULT_ZONE', value: 'http://discovery-server:8761/eureka', purpose: 'Endereço do Eureka.' },
    {
      name: 'SPRING_MONGODB_URI',
      value: 'mongodb://root:pass@mongodb:27017/cart_db?authSource=admin',
      purpose: 'Conexão com o MongoDB (banco cart_db).',
    },
  ],
  links: [
    { label: 'Swagger (via gateway)', url: 'http://localhost:8222/swagger-ui.html' },
    { label: 'OpenAPI via gateway', url: 'http://localhost:8222/v3/api-docs/cart' },
  ],
  sourceFiles: [
    { path: `${BASE}/CartMicroserviceApplication.java`, role: 'Classe main com @EnableFeignClients.' },
    { path: `${BASE}/cart/CartController.java`, role: 'Rotas /api/v1/carts/{customerId}.' },
    { path: `${BASE}/cart/CartService.java`, role: 'Orquestra validações remotas e persistência.' },
    { path: `${BASE}/cart/Cart.java`, role: 'Documento do carrinho com regras de itens.' },
    { path: `${BASE}/item/Item.java`, role: 'Item do carrinho (também usado como corpo da requisição).' },
    { path: `${BASE}/customer/CustomerClient.java`, role: '@FeignClient para o customer-microservice.' },
    { path: `${BASE}/product/ProductClient.java`, role: '@FeignClient para o product-microservice.' },
    { path: `${BASE}/exceptions/CartExceptionHandler.java`, role: 'Advice que estende ResponseEntityExceptionHandler.' },
  ],
  docs: [
    { label: 'Comunicação entre serviços', path: '/microservicos/comunicacao' },
    { label: 'Tráfego leste-oeste', path: '/arquitetura/trafego' },
    { label: 'Pontos de atenção', path: '/guias/pontos-de-atencao' },
  ],
};
