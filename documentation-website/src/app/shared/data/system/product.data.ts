import { PRODUCT_APPLICATION_YML, PRODUCT_CONFIG_YML } from '../../content/snippets/config.snippets';
import { COMPOSE_PRODUCT } from '../../content/snippets/docker.snippets';
import { PRODUCT_POM } from '../../content/snippets/maven.snippets';
import { BodyField, EndpointError, ServiceInfo } from '../../models/system.models';
import { COMMON_EXCEPTIONS_DEPENDENCY, FROM_MICROSERVICES, FROM_ROOT } from './dependencies.data';
import { bodyMissingError, errorResponse, json, typeMismatchError, unexpectedError, validationError } from './examples';

const BASE = 'microservices/product-microservice/src/main/java/com/gustavoleterio/microservices/product_microservice';

const productExample = {
  id: 1,
  name: 'Notebook Pro 14',
  description: '16 GB RAM, SSD 512 GB',
  price: 7499.9,
  stock: 12,
  imageUrl: 'https://example.com/img/notebook-pro-14.png',
  categoryId: 1,
  categoryName: 'Eletrônicos',
  categoryDescription: 'Computadores, celulares e acessórios',
};

const categoryExample = {
  id: 1,
  name: 'Eletrônicos',
  description: 'Computadores, celulares e acessórios',
  products: [productExample],
};

const categoryRequestExample = json({ name: 'Eletrônicos', description: 'Computadores, celulares e acessórios' });

const productRequestExample = json({
  name: 'Notebook Pro 14',
  description: '16 GB RAM, SSD 512 GB',
  price: 7499.9,
  stock: 12,
  imageUrl: 'https://example.com/img/notebook-pro-14.png',
  categoryId: 1,
});

const categoryFields: BodyField[] = [
  {
    name: 'name',
    type: 'String',
    required: false,
    rules: 'Sem anotação de validação; a coluna é NOT NULL e UNIQUE no banco',
  },
  { name: 'description', type: 'String', required: false },
];

const productFields: BodyField[] = [
  { name: 'name', type: 'String', required: true, rules: '@NotBlank → "Product name is required"' },
  { name: 'description', type: 'String', required: false },
  { name: 'price', type: 'Double', required: true, rules: '@NotNull → "Product price is required"' },
  { name: 'stock', type: 'Integer', required: true, rules: '@NotNull → "Product stock is required"' },
  { name: 'imageUrl', type: 'String', required: false },
  {
    name: 'categoryId',
    type: 'Integer',
    required: false,
    rules: 'Sem @NotNull, mas precisa apontar para uma categoria existente',
  },
];

const categoryNotFound: EndpointError = {
  status: 404,
  cause: 'Não existe categoria com esse id.',
  source: 'CategoryNotFoundException → ServiceExceptionHandler',
  example: errorResponse({ category: 'Category not found with id: 9' }),
};

const productNotFound: EndpointError = {
  status: 404,
  cause: 'Não existe produto com esse id.',
  source: 'ProductNotFoundException → ServiceExceptionHandler',
  example: errorResponse({ product: 'Product not found with id: 42' }),
};

const idParam = (what: string) => [{ name: 'id', in: 'path' as const, type: 'Integer', description: `Id ${what}.` }];

export const PRODUCT_SERVICE: ServiceInfo = {
  id: 'product-microservice',
  name: 'product-microservice',
  kind: 'negocio',
  tagline: 'Catálogo de categorias e produtos persistido no PostgreSQL (JPA).',
  description:
    'Mantém o catálogo da loja: categorias e os produtos de cada categoria, com preço e estoque. É o único serviço relacional (Spring Data JPA + Hibernate + PostgreSQL) e é consultado pelo cart-microservice para validar produto e estoque.',
  responsibilities: [
    'CRUD de categorias (nome único).',
    'CRUD de produtos vinculados a uma categoria existente.',
    'Listar produtos por categoria.',
    'Informar estoque ao cart-microservice.',
  ],
  port: '8092',
  access:
    'Somente pelo gateway (http://localhost:8222/api/v1/products e /api/v1/categories): a porta não é publicada no docker-compose, o que permite escalar réplicas.',
  database: 'PostgreSQL · banco product_db · tabelas categories e products (ddl-auto: update)',
  image: 'Build local: microservices/product-microservice/Dockerfile (multi-stage, eclipse-temurin:25 JDK → JRE alpine)',
  technologies: [
    'Java 25',
    'Spring Boot 4.1.1',
    'Spring Web MVC',
    'Spring Data JPA / Hibernate',
    'PostgreSQL JDBC',
    'Bean Validation',
    'Spring Cloud Config Client',
    'Eureka Client',
    'springdoc-openapi',
    'Actuator + Micrometer',
    'Lombok',
  ],
  dependencies: [
    {
      artifact: 'spring-boot-starter-data-jpa',
      scope: 'compile',
      origin: 'Declarada no POM do serviço',
      purpose: 'JPA/Hibernate, JpaRepository e controle transacional.',
    },
    {
      artifact: 'org.postgresql:postgresql',
      scope: 'runtime',
      origin: 'Declarada no POM do serviço',
      purpose: 'Driver JDBC: só é necessário em tempo de execução.',
    },
    COMMON_EXCEPTIONS_DEPENDENCY,
    ...FROM_MICROSERVICES,
    ...FROM_ROOT,
  ],
  relations: [
    { label: 'Depende de', targets: ['postgres', 'config-server', 'discovery-server', 'common-exceptions'] },
    { label: 'É chamado por', targets: ['api-gateway', 'cart-microservice'] },
    { label: 'Monitorado por', targets: ['prometheus'] },
  ],
  endpointGroups: [
    {
      title: 'Categorias',
      basePath: '/api/v1/categories',
      description: 'CategoryController. Cada categoria é devolvida com a lista dos seus produtos.',
      endpoints: [
        {
          id: 'categories-list',
          method: 'GET',
          path: '/api/v1/categories',
          summary: 'Lista todas as categorias com seus produtos.',
          handler: 'CategoryController.getAllCategories → CategoryService.getAllCategories',
          responses: [
            { status: 200, description: 'Lista de CategoryResponse.', contentType: 'application/json', example: json([categoryExample]) },
          ],
          errors: [unexpectedError('Falha inesperada, como o PostgreSQL fora do ar.')],
        },
        {
          id: 'categories-get-by-id',
          method: 'GET',
          path: '/api/v1/categories/{id}',
          summary: 'Busca uma categoria pelo id.',
          handler: 'CategoryController.getCategoryById → CategoryService.getCategoryById',
          params: idParam('da categoria'),
          responses: [
            { status: 200, description: 'CategoryResponse com a lista de produtos.', contentType: 'application/json', example: json(categoryExample) },
          ],
          errors: [categoryNotFound, typeMismatchError('id')],
        },
        {
          id: 'categories-create',
          method: 'POST',
          path: '/api/v1/categories',
          summary: 'Cria uma categoria e devolve o id.',
          description: 'Antes de salvar, o service procura uma categoria com o mesmo nome (findByName).',
          handler: 'CategoryController.createCategory → CategoryService.createCategory',
          body: { type: 'CategoryRequest', fields: categoryFields, example: categoryRequestExample },
          responses: [{ status: 200, description: 'Id da categoria criada.', contentType: 'application/json', example: '1' }],
          errors: [
            {
              status: 409,
              cause: 'Já existe uma categoria com esse nome.',
              source: 'CategoryAlreadyExistsException → ServiceExceptionHandler',
              example: errorResponse({ category: 'Category with name Eletrônicos already exists' }),
            },
            bodyMissingError,
            unexpectedError('name ausente: como o CategoryRequest não tem @NotBlank, a constraint NOT NULL do banco estoura (DataIntegrityViolationException).'),
          ],
        },
        {
          id: 'categories-update',
          method: 'PUT',
          path: '/api/v1/categories/{id}',
          summary: 'Atualiza nome e descrição de uma categoria.',
          handler: 'CategoryController.updateCategory → CategoryService.updateCategory',
          params: idParam('da categoria'),
          body: { type: 'CategoryRequest', fields: categoryFields, example: categoryRequestExample },
          responses: [{ status: 200, description: 'Id da categoria atualizada.', contentType: 'application/json', example: '1' }],
          errors: [
            categoryNotFound,
            bodyMissingError,
            unexpectedError('Nome igual ao de outra categoria: aqui não há checagem prévia, então a constraint UNIQUE gera erro 500 em vez de 409.'),
          ],
        },
        {
          id: 'categories-delete',
          method: 'DELETE',
          path: '/api/v1/categories/{id}',
          summary: 'Remove uma categoria.',
          handler: 'CategoryController.deleteCategory → CategoryService.deleteCategory',
          params: idParam('da categoria'),
          responses: [{ status: 200, description: 'Removida. Sem corpo.' }],
          errors: [
            categoryNotFound,
            unexpectedError('A categoria ainda tem produtos: a chave estrangeira category_id impede a remoção.'),
          ],
        },
      ],
    },
    {
      title: 'Produtos',
      basePath: '/api/v1/products',
      description: 'ProductController. Todo produto pertence a uma categoria.',
      endpoints: [
        {
          id: 'products-list',
          method: 'GET',
          path: '/api/v1/products',
          summary: 'Lista todos os produtos.',
          handler: 'ProductController.getAllProducts → ProductService.getAllProducts',
          responses: [
            { status: 200, description: 'Lista de ProductResponse.', contentType: 'application/json', example: json([productExample]) },
          ],
          errors: [unexpectedError('Falha inesperada, como o PostgreSQL fora do ar.')],
        },
        {
          id: 'products-by-category',
          method: 'GET',
          path: '/api/v1/products/category/{categoryId}',
          summary: 'Lista os produtos de uma categoria.',
          description: 'Primeiro confirma que a categoria existe; uma categoria sem produtos devolve lista vazia.',
          handler: 'ProductController.getProductsByCategoryId → ProductService.getProductsByCategoryId',
          params: [{ name: 'categoryId', in: 'path', type: 'Integer', description: 'Id da categoria.' }],
          responses: [
            { status: 200, description: 'Lista de ProductResponse.', contentType: 'application/json', example: json([productExample]) },
          ],
          errors: [categoryNotFound, typeMismatchError('categoryId')],
        },
        {
          id: 'products-get-by-id',
          method: 'GET',
          path: '/api/v1/products/{id}',
          summary: 'Busca um produto pelo id.',
          description: 'É a rota usada pelo ProductClient (Feign) do cart-microservice para validar produto e estoque.',
          handler: 'ProductController.getProductById → ProductService.getProductById',
          params: idParam('do produto'),
          responses: [
            { status: 200, description: 'ProductResponse.', contentType: 'application/json', example: json(productExample) },
          ],
          errors: [productNotFound, typeMismatchError('id')],
        },
        {
          id: 'products-create',
          method: 'POST',
          path: '/api/v1/products',
          summary: 'Cria um produto e devolve o id.',
          handler: 'ProductController.createProduct → ProductService.createProduct',
          body: { type: 'ProductRequest', fields: productFields, example: productRequestExample },
          responses: [{ status: 200, description: 'Id do produto criado.', contentType: 'application/json', example: '1' }],
          errors: [
            validationError({ name: 'Product name is required', price: 'Product price is required' }),
            bodyMissingError,
            categoryNotFound,
            unexpectedError('categoryId ausente: findById(null) lança IllegalArgumentException, que cai no catch-all.'),
          ],
        },
        {
          id: 'products-update',
          method: 'PUT',
          path: '/api/v1/products/{id}',
          summary: 'Atualiza um produto existente.',
          handler: 'ProductController.updateProduct → ProductService.updateProduct',
          params: idParam('do produto'),
          body: { type: 'ProductRequest', fields: productFields, example: productRequestExample },
          responses: [{ status: 200, description: 'Id do produto atualizado.', contentType: 'application/json', example: '1' }],
          errors: [
            validationError({ stock: 'Product stock is required' }),
            bodyMissingError,
            productNotFound,
            categoryNotFound,
          ],
        },
        {
          id: 'products-delete',
          method: 'DELETE',
          path: '/api/v1/products/{id}',
          summary: 'Remove um produto.',
          handler: 'ProductController.deleteProduct → ProductService.deleteProduct',
          params: idParam('do produto'),
          responses: [{ status: 200, description: 'Removido. Sem corpo.' }],
          errors: [productNotFound],
        },
      ],
    },
  ],
  exceptions: [
    {
      name: 'CategoryNotFoundException',
      status: '404 Not Found',
      when: 'Id de categoria inexistente (inclusive ao criar/atualizar produto).',
      handler: 'ServiceExceptionHandler.handleCategoryNotFoundException',
    },
    {
      name: 'ProductNotFoundException',
      status: '404 Not Found',
      when: 'Id de produto inexistente.',
      handler: 'ServiceExceptionHandler.handleProductNotFoundException',
    },
    {
      name: 'CategoryAlreadyExistsException',
      status: '409 Conflict',
      when: 'POST de categoria com nome já cadastrado.',
      handler: 'ServiceExceptionHandler.handleCategoryAlreadyExistsException',
    },
    {
      name: 'MethodArgumentNotValidException',
      status: '400 Bad Request',
      when: 'ProductRequest inválido.',
      handler: 'GlobalExceptionHandler (herdado)',
    },
    {
      name: 'HttpMessageNotReadableException',
      status: '400 Bad Request',
      when: 'Corpo ausente ou JSON malformado.',
      handler: 'GlobalExceptionHandler (herdado)',
    },
    {
      name: 'Exception (qualquer outra)',
      status: '500 Internal Server Error',
      when: 'Violação de constraint no banco, id não numérico, rota inexistente, método não suportado...',
      handler: 'GlobalExceptionHandler (herdado)',
    },
  ],
  config: [
    {
      language: 'yaml',
      code: PRODUCT_APPLICATION_YML,
      file: 'microservices/product-microservice/src/main/resources/application.yml',
    },
    {
      language: 'yaml',
      code: PRODUCT_CONFIG_YML,
      file: 'config-server/src/main/resources/config/product-microservice.yml',
      caption: 'Datasource e JPA vêm do Config Server, com credenciais em variáveis de ambiente.',
    },
    { language: 'yaml', code: COMPOSE_PRODUCT, file: 'docker-compose.yml' },
    { language: 'xml', code: PRODUCT_POM, file: 'microservices/product-microservice/pom.xml' },
  ],
  env: [
    { name: 'SPRING_DATASOURCE_URL', value: 'jdbc:postgresql://postgres:5432/product_db', purpose: 'URL JDBC do PostgreSQL.' },
    { name: 'SPRING_DATASOURCE_USERNAME', value: 'root', purpose: 'Usuário do banco (POSTGRES_USER).' },
    { name: 'SPRING_DATASOURCE_PASSWORD', value: 'pass', purpose: 'Senha do banco (POSTGRES_PASSWORD).' },
    { name: 'SPRING_CONFIG_IMPORT', value: 'configserver:http://config-server:8888', purpose: 'Endereço do Config Server.' },
    { name: 'EUREKA_DEFAULT_ZONE', value: 'http://discovery-server:8761/eureka', purpose: 'Endereço do Eureka.' },
  ],
  links: [
    { label: 'Swagger (via gateway)', url: 'http://localhost:8222/swagger-ui.html' },
    { label: 'OpenAPI via gateway', url: 'http://localhost:8222/v3/api-docs/products' },
  ],
  sourceFiles: [
    { path: `${BASE}/ProductMicroserviceApplication.java`, role: 'Classe main.' },
    { path: `${BASE}/category/CategoryController.java`, role: 'Rotas /api/v1/categories.' },
    { path: `${BASE}/category/CategoryService.java`, role: 'Regras de categoria (nome único).' },
    { path: `${BASE}/category/Category.java`, role: 'Entidade JPA (tabela categories, @OneToMany).' },
    { path: `${BASE}/category/CategoryMapper.java`, role: 'Conversões de categoria (usa o ProductMapper).' },
    { path: `${BASE}/product/ProductController.java`, role: 'Rotas /api/v1/products.' },
    { path: `${BASE}/product/ProductService.java`, role: 'Regras de produto (valida a categoria).' },
    { path: `${BASE}/product/Product.java`, role: 'Entidade JPA (tabela products, @ManyToOne).' },
    { path: `${BASE}/product/ProductRepository.java`, role: 'JpaRepository + findByCategoryId.' },
    { path: `${BASE}/exceptions/ServiceExceptionHandler.java`, role: 'Advice que estende o GlobalExceptionHandler.' },
  ],
  docs: [
    { label: 'Persistência (JPA)', path: '/microservicos/persistencia' },
    { label: 'Respostas e erros', path: '/microservicos/respostas-e-erros' },
    { label: 'Load balancer', path: '/arquitetura/load-balancer' },
  ],
};
