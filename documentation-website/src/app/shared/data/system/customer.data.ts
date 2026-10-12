import { CUSTOMER_APPLICATION_YML, CUSTOMER_CONFIG_YML } from '../../content/snippets/config.snippets';
import { COMPOSE_CUSTOMER } from '../../content/snippets/docker.snippets';
import { CUSTOMER_POM } from '../../content/snippets/maven.snippets';
import { ServiceInfo } from '../../models/system.models';
import { COMMON_EXCEPTIONS_DEPENDENCY, FROM_MICROSERVICES, FROM_ROOT } from './dependencies.data';
import {
  CUSTOMER_ID,
  bodyMissingError,
  errorResponse,
  json,
  unexpectedError,
  validationError,
} from './examples';

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
  cause: 'Não existe documento com esse id na coleção customer.',
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

export const CUSTOMER_SERVICE: ServiceInfo = {
  id: 'customer-microservice',
  name: 'customer-microservice',
  kind: 'negocio',
  tagline: 'Cadastro de clientes (CRUD) persistido no MongoDB.',
  description:
    'Mantém os dados cadastrais dos clientes da loja. É a fonte de verdade sobre "quem é o cliente": o cart-microservice consulta este serviço (via OpenFeign) antes de criar ou alterar um carrinho.',
  responsibilities: [
    'Criar, listar, consultar, atualizar e remover clientes.',
    'Validar os dados de entrada (nome, sobrenome e e-mail obrigatórios; e-mail em formato válido).',
    'Responder ao cart-microservice se um cliente existe.',
  ],
  port: '8091',
  access:
    'Pelo gateway em http://localhost:8222/api/v1/customers ou direto em http://localhost:8091 (é o único serviço de negócio com porta publicada no docker-compose).',
  database: 'MongoDB · banco customer_db · coleção customer',
  image: 'Build local: microservices/customer-microservice/Dockerfile (multi-stage, eclipse-temurin:25 JDK → JRE alpine)',
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
      origin: 'Declarada no POM do serviço',
      purpose: 'MongoRepository, mapeamento @Document e conexão via spring.mongodb.uri.',
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
    { label: 'Depende de', targets: ['mongodb', 'config-server', 'discovery-server', 'common-exceptions'] },
    { label: 'É chamado por', targets: ['api-gateway', 'cart-microservice'] },
    { label: 'Monitorado por', targets: ['prometheus'] },
  ],
  endpointGroups: [
    {
      title: 'Clientes',
      basePath: '/api/v1/customers',
      description: 'CustomerController: todas as rotas recebem e devolvem JSON (exceto o POST, que devolve o id em texto).',
      endpoints: [
        {
          id: 'customers-get-by-id',
          method: 'GET',
          path: '/api/v1/customers/{customerId}',
          summary: 'Busca um cliente pelo id.',
          description: 'Também é a rota usada pelo CustomerClient (Feign) do cart-microservice para validar se o cliente existe.',
          handler: 'CustomerController.getCustomerById → CustomerService.getCustomerById',
          params: [{ name: 'customerId', in: 'path', type: 'String', description: 'ObjectId do MongoDB.' }],
          responses: [
            { status: 200, description: 'Cliente encontrado (CustomerResponse).', contentType: 'application/json', example: json(customerExample) },
          ],
          errors: [notFound, unexpectedError('Falha inesperada, como o MongoDB fora do ar.')],
        },
        {
          id: 'customers-get-all',
          method: 'GET',
          path: '/api/v1/customers/all',
          summary: 'Lista todos os clientes.',
          description: 'O segmento literal /all tem prioridade sobre /{customerId} no mapeamento do Spring MVC.',
          handler: 'CustomerController.getAllCustomers → CustomerService.getAllCustomers',
          responses: [
            {
              status: 200,
              description: 'Lista de CustomerResponse (vazia quando não há clientes).',
              contentType: 'application/json',
              example: json([customerExample]),
            },
          ],
          errors: [unexpectedError('Falha inesperada, como o MongoDB fora do ar.')],
        },
        {
          id: 'customers-create',
          method: 'POST',
          path: '/api/v1/customers',
          summary: 'Cadastra um cliente e devolve o id gerado.',
          handler: 'CustomerController.createCustomer → CustomerService.createCustomer',
          body: { type: 'CustomerRequest', fields: requestFields, example: requestExample },
          responses: [
            {
              status: 200,
              description: 'Id (ObjectId) do cliente criado, como texto puro (ResponseEntity<String>).',
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
          summary: 'Substitui os dados de um cliente existente.',
          description:
            'A validação do corpo (@Valid) acontece antes de o método rodar; só depois o service confere se o id existe. O retorno é 202 Accepted sem corpo.',
          handler: 'CustomerController.updateCustomer → CustomerService.updateCustomer',
          params: [{ name: 'customerId', in: 'path', type: 'String', description: 'ObjectId do cliente.' }],
          body: { type: 'CustomerRequest', fields: requestFields, example: requestExample },
          responses: [{ status: 202, description: 'Atualizado. Sem corpo.' }],
          errors: [validationError({ lastName: 'Last name is required' }), bodyMissingError, notFound],
        },
        {
          id: 'customers-delete',
          method: 'DELETE',
          path: '/api/v1/customers/{customerId}',
          summary: 'Remove um cliente.',
          handler: 'CustomerController.deleteCustomer → CustomerService.deleteCustomer',
          params: [{ name: 'customerId', in: 'path', type: 'String', description: 'ObjectId do cliente.' }],
          responses: [{ status: 202, description: 'Removido. Sem corpo.' }],
          errors: [notFound],
        },
      ],
    },
  ],
  exceptions: [
    {
      name: 'CustomerNotFoundException',
      status: '404 Not Found',
      when: 'Busca, atualização ou remoção de um id inexistente.',
      handler: 'CustomerExceptionHandler.handleCustomerNotFoundException',
    },
    {
      name: 'MethodArgumentNotValidException',
      status: '400 Bad Request',
      when: 'CustomerRequest inválido no POST/PUT.',
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
      when: 'Erros inesperados. Atenção: também captura 404 de rota inexistente e 405 de método não suportado.',
      handler: 'GlobalExceptionHandler (herdado)',
    },
  ],
  config: [
    {
      language: 'yaml',
      code: CUSTOMER_APPLICATION_YML,
      file: 'microservices/customer-microservice/src/main/resources/application.yml',
      caption: 'Configuração local mínima: nome da aplicação e de onde importar o restante.',
    },
    {
      language: 'yaml',
      code: CUSTOMER_CONFIG_YML,
      file: 'config-server/src/main/resources/config/customer-microservice.yml',
      caption: 'Configuração real, servida pelo Config Server.',
    },
    { language: 'yaml', code: COMPOSE_CUSTOMER, file: 'docker-compose.yml', caption: 'Definição do container.' },
    { language: 'xml', code: CUSTOMER_POM, file: 'microservices/customer-microservice/pom.xml' },
  ],
  env: [
    {
      name: 'SPRING_CONFIG_IMPORT',
      value: 'configserver:http://config-server:8888',
      purpose: 'Sobrescreve o default optional:configserver:http://localhost:8888 do application.yml.',
    },
    {
      name: 'EUREKA_DEFAULT_ZONE',
      value: 'http://discovery-server:8761/eureka',
      purpose: 'Placeholder usado em eureka.client.service-url.defaultZone.',
    },
    {
      name: 'SPRING_MONGODB_URI',
      value: 'mongodb://root:pass@mongodb:27017/customer_db?authSource=admin',
      purpose: 'Conexão com o MongoDB (usuário root autenticado no banco admin).',
    },
  ],
  links: [
    { label: 'Swagger UI (direto)', url: 'http://localhost:8091/swagger-ui.html' },
    { label: 'OpenAPI JSON', url: 'http://localhost:8091/v3/api-docs' },
    { label: 'Health', url: 'http://localhost:8091/actuator/health' },
    { label: 'Métricas Prometheus', url: 'http://localhost:8091/actuator/prometheus' },
  ],
  sourceFiles: [
    { path: `${BASE}/CustomerMicroserviceApplication.java`, role: 'Classe main (@SpringBootApplication).' },
    { path: `${BASE}/customer/CustomerController.java`, role: 'Controller REST: rotas /api/v1/customers.' },
    { path: `${BASE}/customer/CustomerService.java`, role: 'Regras de negócio e lançamento de CustomerNotFoundException.' },
    { path: `${BASE}/customer/CustomerRepository.java`, role: 'MongoRepository<Customer, String>.' },
    { path: `${BASE}/customer/Customer.java`, role: 'Documento MongoDB (@Document).' },
    { path: `${BASE}/customer/CustomerMapper.java`, role: 'Conversão Request → entidade → Response.' },
    { path: `${BASE}/customer/CustomerRequest.java`, role: 'Record de entrada com Bean Validation.' },
    { path: `${BASE}/customer/CustomerResponse.java`, role: 'Record de saída (@Builder).' },
    { path: `${BASE}/exceptions/CustomerExceptionHandler.java`, role: 'Advice que estende o GlobalExceptionHandler.' },
    { path: `${BASE}/exceptions/CustomerNotFoundException.java`, role: 'Exceção de domínio → 404.' },
  ],
  docs: [
    { label: 'Camadas (MVC)', path: '/microservicos/camadas-mvc' },
    { label: 'Persistência', path: '/microservicos/persistencia' },
    { label: 'Captura de exceptions', path: '/codigo/captura-de-exceptions' },
    { label: 'Records como DTOs', path: '/codigo/records-como-dtos' },
  ],
};
