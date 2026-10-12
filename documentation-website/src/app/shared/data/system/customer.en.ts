import { CUSTOMER_APPLICATION_YML, CUSTOMER_CONFIG_YML } from '../../content/snippets/config.snippets';
import { COMPOSE_CUSTOMER } from '../../content/snippets/docker.snippets';
import { CUSTOMER_POM } from '../../content/snippets/maven.snippets';
import { ServiceInfo } from '../../models/system.models';
import { COMMON_EXCEPTIONS_DEPENDENCY_EN, FROM_MICROSERVICES_EN, FROM_ROOT_EN } from './dependencies.en';
import {
  CUSTOMER_ID,
  bodyMissingError,
  errorResponse,
  json,
  unexpectedError,
  validationError,
} from './examples.en';

const BASE = 'microservices/customer-microservice/src/main/java/com/gustavoleterio/microservices/customer_microservice';

const customerExample = {
  id: CUSTOMER_ID,
  firstName: 'Maria',
  lastName: 'Silva',
  email: 'maria.silva@email.com',
  phone: '+55 11 98888-7777',
  address: 'Rua das Flores, 123',
  city: 'São Paulo',
};

const requestExample = json({
  firstName: 'Maria',
  lastName: 'Silva',
  email: 'maria.silva@email.com',
  phone: '+55 11 98888-7777',
  address: 'Rua das Flores, 123',
  city: 'São Paulo',
});

const notFound = {
  status: 404,
  cause: 'No document with that id exists in the customer collection.',
  source: 'CustomerNotFoundException → CustomerExceptionHandler',
  example: errorResponse({ customer: `Customer not found with id: ${CUSTOMER_ID}` }),
};

const requestFields = [
  { name: 'firstName', type: 'String', required: true, rules: '@NotBlank → "First name is required"' },
  { name: 'lastName', type: 'String', required: true, rules: '@NotBlank → "Last name is required"' },
  {
    name: 'email',
    type: 'String',
    required: true,
    rules: '@NotBlank → "Email is required" · @Email → "Invalid email address"',
  },
  { name: 'phone', type: 'String', required: false },
  { name: 'address', type: 'String', required: false },
  { name: 'city', type: 'String', required: false },
];

export const CUSTOMER_SERVICE_EN: ServiceInfo = {
  id: 'customer-microservice',
  name: 'customer-microservice',
  kind: 'negocio',
  tagline: 'Customer registry (CRUD) persisted in MongoDB.',
  description:
    'Holds the store\'s customer records. It is the source of truth for "who the customer is": cart-microservice calls this service (via OpenFeign) before creating or changing a cart.',
  responsibilities: [
    'Create, list, look up, update, and delete customers.',
    'Validate input (first name, last name, and email are required; email must be a valid format).',
    'Tell cart-microservice whether a customer exists.',
  ],
  port: '8091',
  access:
    'Through the gateway at http://localhost:8222/api/v1/customers, or directly at http://localhost:8091 (it is the only business service with a published port in docker-compose).',
  database: 'MongoDB · database customer_db · collection customer',
  image: 'Local build: microservices/customer-microservice/Dockerfile (multi-stage, eclipse-temurin:25 JDK → JRE alpine)',
  technologies: [
    'Java 25',
    'Spring Boot 4.1.1',
    'Spring Web MVC',
    'Spring Data MongoDB',
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
      purpose: 'MongoRepository, @Document mapping, and the connection via spring.mongodb.uri.',
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
    { label: 'Depends on', targets: ['mongodb', 'config-server', 'discovery-server', 'common-exceptions'] },
    { label: 'Called by', targets: ['api-gateway', 'cart-microservice'] },
    { label: 'Monitored by', targets: ['prometheus'] },
  ],
  endpointGroups: [
    {
      title: 'Customers',
      basePath: '/api/v1/customers',
      description: 'CustomerController: every route accepts and returns JSON (except POST, which returns the id as text).',
      endpoints: [
        {
          id: 'customers-get-by-id',
          method: 'GET',
          path: '/api/v1/customers/{customerId}',
          summary: 'Looks up a customer by id.',
          description: 'This is also the route used by cart-microservice\'s CustomerClient (Feign) to check that the customer exists.',
          handler: 'CustomerController.getCustomerById → CustomerService.getCustomerById',
          params: [{ name: 'customerId', in: 'path', type: 'String', description: 'MongoDB ObjectId.' }],
          responses: [
            { status: 200, description: 'Customer found (CustomerResponse).', contentType: 'application/json', example: json(customerExample) },
          ],
          errors: [notFound, unexpectedError('Unexpected failure, such as MongoDB being down.')],
        },
        {
          id: 'customers-get-all',
          method: 'GET',
          path: '/api/v1/customers/all',
          summary: 'Lists every customer.',
          description: 'The literal /all segment takes precedence over /{customerId} in Spring MVC mapping.',
          handler: 'CustomerController.getAllCustomers → CustomerService.getAllCustomers',
          responses: [
            {
              status: 200,
              description: 'List of CustomerResponse (empty when there are no customers).',
              contentType: 'application/json',
              example: json([customerExample]),
            },
          ],
          errors: [unexpectedError('Unexpected failure, such as MongoDB being down.')],
        },
        {
          id: 'customers-create',
          method: 'POST',
          path: '/api/v1/customers',
          summary: 'Creates a customer and returns the generated id.',
          handler: 'CustomerController.createCustomer → CustomerService.createCustomer',
          body: { type: 'CustomerRequest', fields: requestFields, example: requestExample },
          responses: [
            {
              status: 200,
              description: 'Id (ObjectId) of the created customer, as plain text (ResponseEntity<String>).',
              contentType: 'text/plain',
              example: CUSTOMER_ID,
            },
          ],
          errors: [
            validationError({ firstName: 'First name is required', email: 'Invalid email address' }),
            bodyMissingError,
          ],
        },
        {
          id: 'customers-update',
          method: 'PUT',
          path: '/api/v1/customers/{customerId}',
          summary: 'Replaces the data of an existing customer.',
          description:
            'Body validation (@Valid) runs before the method; only then does the service check that the id exists. The response is 202 Accepted with no body.',
          handler: 'CustomerController.updateCustomer → CustomerService.updateCustomer',
          params: [{ name: 'customerId', in: 'path', type: 'String', description: 'Customer ObjectId.' }],
          body: { type: 'CustomerRequest', fields: requestFields, example: requestExample },
          responses: [{ status: 202, description: 'Updated. No body.' }],
          errors: [validationError({ lastName: 'Last name is required' }), bodyMissingError, notFound],
        },
        {
          id: 'customers-delete',
          method: 'DELETE',
          path: '/api/v1/customers/{customerId}',
          summary: 'Deletes a customer.',
          handler: 'CustomerController.deleteCustomer → CustomerService.deleteCustomer',
          params: [{ name: 'customerId', in: 'path', type: 'String', description: 'Customer ObjectId.' }],
          responses: [{ status: 202, description: 'Deleted. No body.' }],
          errors: [notFound],
        },
      ],
    },
  ],
  exceptions: [
    {
      name: 'CustomerNotFoundException',
      status: '404 Not Found',
      when: 'Lookup, update, or deletion of an id that does not exist.',
      handler: 'CustomerExceptionHandler.handleCustomerNotFoundException',
    },
    {
      name: 'MethodArgumentNotValidException',
      status: '400 Bad Request',
      when: 'Invalid CustomerRequest on POST/PUT.',
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
      when: 'Unexpected errors. Note: this also catches 404 for an unknown route and 405 for an unsupported method.',
      handler: 'GlobalExceptionHandler (inherited)',
    },
  ],
  config: [
    {
      language: 'yaml',
      code: CUSTOMER_APPLICATION_YML,
      file: 'microservices/customer-microservice/src/main/resources/application.yml',
      caption: 'Minimal local configuration: application name and where to import the rest from.',
    },
    {
      language: 'yaml',
      code: CUSTOMER_CONFIG_YML,
      file: 'config-server/src/main/resources/config/customer-microservice.yml',
      caption: 'Real configuration, served by the Config Server.',
    },
    { language: 'yaml', code: COMPOSE_CUSTOMER, file: 'docker-compose.yml', caption: 'Container definition.' },
    { language: 'xml', code: CUSTOMER_POM, file: 'microservices/customer-microservice/pom.xml' },
  ],
  env: [
    {
      name: 'SPRING_CONFIG_IMPORT',
      value: 'configserver:http://config-server:8888',
      purpose: 'Overrides the application.yml default optional:configserver:http://localhost:8888.',
    },
    {
      name: 'EUREKA_DEFAULT_ZONE',
      value: 'http://discovery-server:8761/eureka',
      purpose: 'Placeholder used in eureka.client.service-url.defaultZone.',
    },
    {
      name: 'SPRING_MONGODB_URI',
      value: 'mongodb://root:pass@mongodb:27017/customer_db?authSource=admin',
      purpose: 'MongoDB connection (root user authenticated against the admin database).',
    },
  ],
  links: [
    { label: 'Swagger UI (direct)', url: 'http://localhost:8091/swagger-ui.html' },
    { label: 'OpenAPI JSON', url: 'http://localhost:8091/v3/api-docs' },
    { label: 'Health', url: 'http://localhost:8091/actuator/health' },
    { label: 'Prometheus metrics', url: 'http://localhost:8091/actuator/prometheus' },
  ],
  sourceFiles: [
    { path: `${BASE}/CustomerMicroserviceApplication.java`, role: 'Main class (@SpringBootApplication).' },
    { path: `${BASE}/customer/CustomerController.java`, role: 'REST controller: /api/v1/customers routes.' },
    { path: `${BASE}/customer/CustomerService.java`, role: 'Business rules and CustomerNotFoundException.' },
    { path: `${BASE}/customer/CustomerRepository.java`, role: 'MongoRepository<Customer, String>.' },
    { path: `${BASE}/customer/Customer.java`, role: 'MongoDB document (@Document).' },
    { path: `${BASE}/customer/CustomerMapper.java`, role: 'Request → entity → Response conversion.' },
    { path: `${BASE}/customer/CustomerRequest.java`, role: 'Input record with Bean Validation.' },
    { path: `${BASE}/customer/CustomerResponse.java`, role: 'Output record (@Builder).' },
    { path: `${BASE}/exceptions/CustomerExceptionHandler.java`, role: 'Advice that extends GlobalExceptionHandler.' },
    { path: `${BASE}/exceptions/CustomerNotFoundException.java`, role: 'Domain exception → 404.' },
  ],
  docs: [
    { label: 'Layers (MVC)', path: '/microservicos/camadas-mvc' },
    { label: 'Persistence', path: '/microservicos/persistencia' },
    { label: 'Exception handling', path: '/codigo/captura-de-exceptions' },
    { label: 'Records as DTOs', path: '/codigo/records-como-dtos' },
  ],
};
