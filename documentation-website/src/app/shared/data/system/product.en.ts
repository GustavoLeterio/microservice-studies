import { PRODUCT_APPLICATION_YML, PRODUCT_CONFIG_YML } from '../../content/snippets/config.snippets';
import { COMPOSE_PRODUCT } from '../../content/snippets/docker.snippets';
import { PRODUCT_POM } from '../../content/snippets/maven.snippets';
import { BodyField, EndpointError, ServiceInfo } from '../../models/system.models';
import { COMMON_EXCEPTIONS_DEPENDENCY_EN, FROM_MICROSERVICES_EN, FROM_ROOT_EN } from './dependencies.en';
import { bodyMissingError, errorResponse, json, typeMismatchError, unexpectedError, validationError } from './examples.en';

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
    rules: 'No validation annotation; the column is NOT NULL and UNIQUE in the database',
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
    rules: 'No @NotNull, but it must point to an existing category',
  },
];

const categoryNotFound: EndpointError = {
  status: 404,
  cause: 'No category exists with that id.',
  source: 'CategoryNotFoundException → ServiceExceptionHandler',
  example: errorResponse({ category: 'Category not found with id: 9' }),
};

const productNotFound: EndpointError = {
  status: 404,
  cause: 'No product exists with that id.',
  source: 'ProductNotFoundException → ServiceExceptionHandler',
  example: errorResponse({ product: 'Product not found with id: 42' }),
};

const idParam = (what: string) => [{ name: 'id', in: 'path' as const, type: 'Integer', description: `Id of the ${what}.` }];

export const PRODUCT_SERVICE_EN: ServiceInfo = {
  id: 'product-microservice',
  name: 'product-microservice',
  kind: 'negocio',
  tagline: 'Catalog of categories and products persisted in PostgreSQL (JPA).',
  description:
    'Holds the store catalog: categories and the products in each category, with price and stock. It is the only relational service (Spring Data JPA + Hibernate + PostgreSQL) and is queried by cart-microservice to validate product and stock.',
  responsibilities: [
    'CRUD for categories (unique name).',
    'CRUD for products linked to an existing category.',
    'List products by category.',
    'Report stock to cart-microservice.',
  ],
  port: '8092',
  access:
    'Only through the gateway (http://localhost:8222/api/v1/products and /api/v1/categories): the port is not published in docker-compose, which allows scaling replicas.',
  database: 'PostgreSQL · database product_db · tables categories and products (ddl-auto: update)',
  image: 'Local build: microservices/product-microservice/Dockerfile (multi-stage, eclipse-temurin:25 JDK → JRE alpine)',
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
      origin: 'Declared in the service POM',
      purpose: 'JPA/Hibernate, JpaRepository, and transaction control.',
    },
    {
      artifact: 'org.postgresql:postgresql',
      scope: 'runtime',
      origin: 'Declared in the service POM',
      purpose: 'JDBC driver: needed only at runtime.',
    },
    COMMON_EXCEPTIONS_DEPENDENCY_EN,
    ...FROM_MICROSERVICES_EN,
    ...FROM_ROOT_EN,
  ],
  relations: [
    { label: 'Depends on', targets: ['postgres', 'config-server', 'discovery-server', 'common-exceptions'] },
    { label: 'Called by', targets: ['api-gateway', 'cart-microservice'] },
    { label: 'Monitored by', targets: ['prometheus'] },
  ],
  endpointGroups: [
    {
      title: 'Categories',
      basePath: '/api/v1/categories',
      description: 'CategoryController. Each category is returned with the list of its products.',
      endpoints: [
        {
          id: 'categories-list',
          method: 'GET',
          path: '/api/v1/categories',
          summary: 'Lists every category with its products.',
          handler: 'CategoryController.getAllCategories → CategoryService.getAllCategories',
          responses: [
            { status: 200, description: 'List of CategoryResponse.', contentType: 'application/json', example: json([categoryExample]) },
          ],
          errors: [unexpectedError('Unexpected failure, such as PostgreSQL being down.')],
        },
        {
          id: 'categories-get-by-id',
          method: 'GET',
          path: '/api/v1/categories/{id}',
          summary: 'Looks up a category by id.',
          handler: 'CategoryController.getCategoryById → CategoryService.getCategoryById',
          params: idParam('category'),
          responses: [
            { status: 200, description: 'CategoryResponse with the product list.', contentType: 'application/json', example: json(categoryExample) },
          ],
          errors: [categoryNotFound, typeMismatchError('id')],
        },
        {
          id: 'categories-create',
          method: 'POST',
          path: '/api/v1/categories',
          summary: 'Creates a category and returns the id.',
          description: 'Before saving, the service looks for a category with the same name (findByName).',
          handler: 'CategoryController.createCategory → CategoryService.createCategory',
          body: { type: 'CategoryRequest', fields: categoryFields, example: categoryRequestExample },
          responses: [{ status: 200, description: 'Id of the created category.', contentType: 'application/json', example: '1' }],
          errors: [
            {
              status: 409,
              cause: 'A category with that name already exists.',
              source: 'CategoryAlreadyExistsException → ServiceExceptionHandler',
              example: errorResponse({ category: 'Category with name Eletrônicos already exists' }),
            },
            bodyMissingError,
            unexpectedError('Missing name: because CategoryRequest has no @NotBlank, the database NOT NULL constraint fails (DataIntegrityViolationException).'),
          ],
        },
        {
          id: 'categories-update',
          method: 'PUT',
          path: '/api/v1/categories/{id}',
          summary: 'Updates a category name and description.',
          handler: 'CategoryController.updateCategory → CategoryService.updateCategory',
          params: idParam('category'),
          body: { type: 'CategoryRequest', fields: categoryFields, example: categoryRequestExample },
          responses: [{ status: 200, description: 'Id of the updated category.', contentType: 'application/json', example: '1' }],
          errors: [
            categoryNotFound,
            bodyMissingError,
            unexpectedError('Name matching another category: there is no prior check here, so the UNIQUE constraint produces a 500 instead of 409.'),
          ],
        },
        {
          id: 'categories-delete',
          method: 'DELETE',
          path: '/api/v1/categories/{id}',
          summary: 'Deletes a category.',
          handler: 'CategoryController.deleteCategory → CategoryService.deleteCategory',
          params: idParam('category'),
          responses: [{ status: 200, description: 'Deleted. No body.' }],
          errors: [
            categoryNotFound,
            unexpectedError('The category still has products: the category_id foreign key blocks the deletion.'),
          ],
        },
      ],
    },
    {
      title: 'Products',
      basePath: '/api/v1/products',
      description: 'ProductController. Every product belongs to a category.',
      endpoints: [
        {
          id: 'products-list',
          method: 'GET',
          path: '/api/v1/products',
          summary: 'Lists every product.',
          handler: 'ProductController.getAllProducts → ProductService.getAllProducts',
          responses: [
            { status: 200, description: 'List of ProductResponse.', contentType: 'application/json', example: json([productExample]) },
          ],
          errors: [unexpectedError('Unexpected failure, such as PostgreSQL being down.')],
        },
        {
          id: 'products-by-category',
          method: 'GET',
          path: '/api/v1/products/category/{categoryId}',
          summary: 'Lists the products in a category.',
          description: 'First confirms that the category exists; a category with no products returns an empty list.',
          handler: 'ProductController.getProductsByCategoryId → ProductService.getProductsByCategoryId',
          params: [{ name: 'categoryId', in: 'path', type: 'Integer', description: 'Category id.' }],
          responses: [
            { status: 200, description: 'List of ProductResponse.', contentType: 'application/json', example: json([productExample]) },
          ],
          errors: [categoryNotFound, typeMismatchError('categoryId')],
        },
        {
          id: 'products-get-by-id',
          method: 'GET',
          path: '/api/v1/products/{id}',
          summary: 'Looks up a product by id.',
          description: 'This is the route used by cart-microservice\'s ProductClient (Feign) to validate product and stock.',
          handler: 'ProductController.getProductById → ProductService.getProductById',
          params: idParam('product'),
          responses: [
            { status: 200, description: 'ProductResponse.', contentType: 'application/json', example: json(productExample) },
          ],
          errors: [productNotFound, typeMismatchError('id')],
        },
        {
          id: 'products-create',
          method: 'POST',
          path: '/api/v1/products',
          summary: 'Creates a product and returns the id.',
          handler: 'ProductController.createProduct → ProductService.createProduct',
          body: { type: 'ProductRequest', fields: productFields, example: productRequestExample },
          responses: [{ status: 200, description: 'Id of the created product.', contentType: 'application/json', example: '1' }],
          errors: [
            validationError({ name: 'Product name is required', price: 'Product price is required' }),
            bodyMissingError,
            categoryNotFound,
            unexpectedError('Missing categoryId: findById(null) throws IllegalArgumentException, which falls through to the catch-all.'),
          ],
        },
        {
          id: 'products-update',
          method: 'PUT',
          path: '/api/v1/products/{id}',
          summary: 'Updates an existing product.',
          handler: 'ProductController.updateProduct → ProductService.updateProduct',
          params: idParam('product'),
          body: { type: 'ProductRequest', fields: productFields, example: productRequestExample },
          responses: [{ status: 200, description: 'Id of the updated product.', contentType: 'application/json', example: '1' }],
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
          summary: 'Deletes a product.',
          handler: 'ProductController.deleteProduct → ProductService.deleteProduct',
          params: idParam('product'),
          responses: [{ status: 200, description: 'Deleted. No body.' }],
          errors: [productNotFound],
        },
      ],
    },
  ],
  exceptions: [
    {
      name: 'CategoryNotFoundException',
      status: '404 Not Found',
      when: 'Unknown category id (including when creating or updating a product).',
      handler: 'ServiceExceptionHandler.handleCategoryNotFoundException',
    },
    {
      name: 'ProductNotFoundException',
      status: '404 Not Found',
      when: 'Unknown product id.',
      handler: 'ServiceExceptionHandler.handleProductNotFoundException',
    },
    {
      name: 'CategoryAlreadyExistsException',
      status: '409 Conflict',
      when: 'POST of a category whose name is already registered.',
      handler: 'ServiceExceptionHandler.handleCategoryAlreadyExistsException',
    },
    {
      name: 'MethodArgumentNotValidException',
      status: '400 Bad Request',
      when: 'Invalid ProductRequest.',
      handler: 'GlobalExceptionHandler (inherited)',
    },
    {
      name: 'HttpMessageNotReadableException',
      status: '400 Bad Request',
      when: 'Missing body or malformed JSON.',
      handler: 'GlobalExceptionHandler (inherited)',
    },
    {
      name: 'Exception (any other)',
      status: '500 Internal Server Error',
      when: 'Database constraint violation, non-numeric id, unknown route, unsupported method...',
      handler: 'GlobalExceptionHandler (inherited)',
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
      caption: 'Datasource and JPA come from the Config Server, with credentials in environment variables.',
    },
    { language: 'yaml', code: COMPOSE_PRODUCT, file: 'docker-compose.yml' },
    { language: 'xml', code: PRODUCT_POM, file: 'microservices/product-microservice/pom.xml' },
  ],
  env: [
    { name: 'SPRING_DATASOURCE_URL', value: 'jdbc:postgresql://postgres:5432/product_db', purpose: 'PostgreSQL JDBC URL.' },
    { name: 'SPRING_DATASOURCE_USERNAME', value: 'root', purpose: 'Database user (POSTGRES_USER).' },
    { name: 'SPRING_DATASOURCE_PASSWORD', value: 'pass', purpose: 'Database password (POSTGRES_PASSWORD).' },
    { name: 'SPRING_CONFIG_IMPORT', value: 'configserver:http://config-server:8888', purpose: 'Config Server address.' },
    { name: 'EUREKA_DEFAULT_ZONE', value: 'http://discovery-server:8761/eureka', purpose: 'Eureka address.' },
  ],
  links: [
    { label: 'Swagger (via gateway)', url: 'http://localhost:8222/swagger-ui.html' },
    { label: 'OpenAPI via gateway', url: 'http://localhost:8222/v3/api-docs/products' },
  ],
  sourceFiles: [
    { path: `${BASE}/ProductMicroserviceApplication.java`, role: 'Main class.' },
    { path: `${BASE}/category/CategoryController.java`, role: 'Routes /api/v1/categories.' },
    { path: `${BASE}/category/CategoryService.java`, role: 'Category rules (unique name).' },
    { path: `${BASE}/category/Category.java`, role: 'JPA entity (categories table, @OneToMany).' },
    { path: `${BASE}/category/CategoryMapper.java`, role: 'Category conversions (uses ProductMapper).' },
    { path: `${BASE}/product/ProductController.java`, role: 'Routes /api/v1/products.' },
    { path: `${BASE}/product/ProductService.java`, role: 'Product rules (validates the category).' },
    { path: `${BASE}/product/Product.java`, role: 'JPA entity (products table, @ManyToOne).' },
    { path: `${BASE}/product/ProductRepository.java`, role: 'JpaRepository + findByCategoryId.' },
    { path: `${BASE}/exceptions/ServiceExceptionHandler.java`, role: 'Advice that extends GlobalExceptionHandler.' },
  ],
  docs: [
    { label: 'Persistence (JPA)', path: '/microservicos/persistencia' },
    { label: 'Responses and errors', path: '/microservicos/respostas-e-erros' },
    { label: 'Load balancer', path: '/arquitetura/load-balancer' },
  ],
};
