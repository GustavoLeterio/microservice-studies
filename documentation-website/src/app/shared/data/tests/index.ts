import { CART_TESTS } from './cart.tests';
import { COMMON_EXCEPTION_TESTS } from './common-exceptions.tests';
import { CUSTOMER_TESTS } from './customer.tests';
import { PRODUCT_TESTS } from './product.tests';
import { DocTest, TestClassNote, TestModuleDoc } from './test.models';

export const TEST_MODULES: TestModuleDoc[] = [
  {
    id: 'common-exceptions',
    name: { pt: 'common-exceptions', en: 'common-exceptions' },
    summary: {
      pt: 'Biblioteca compartilhada por customer e product. Um StubController dispara validação, tipo errado e exceção genérica pelo pipeline MVC, sem depender do domínio.',
      en: 'Library shared by customer and product. A stub controller fires validation, a wrong path type, and a generic exception through the real MVC pipeline, without the business domain.',
    },
  },
  {
    id: 'customer-microservice',
    name: { pt: 'customer-microservice', en: 'customer-microservice' },
    summary: {
      pt: 'Três classes, na ordem da leitura: mapper (record HTTP e documento Mongo), service (repositório mockado e mapper real) e controller (status, corpo e validação que barra o serviço).',
      en: 'Three classes, in reading order: mapper (HTTP record and Mongo document), service (mocked repository and real mapper), and controller (status, body, and validation that stops the service).',
    },
  },
  {
    id: 'product-microservice',
    name: { pt: 'product-microservice', en: 'product-microservice' },
    summary: {
      pt: 'Mapper de produto e categoria juntos, depois os services e os controllers. Nome duplicado, categoria em uso e violação do banco aparecem como 409.',
      en: 'Product and category mappers together, then the services and the controllers. A duplicate name, a category still in use, and a database violation show up as 409.',
    },
  },
  {
    id: 'cart-microservice',
    name: { pt: 'cart-microservice', en: 'cart-microservice' },
    summary: {
      pt: 'O único serviço com regra de domínio fora do service (lista mutável e igualdade de Integer) e com chamada Feign. A tradução do erro downstream fica no controller.',
      en: 'The only service with domain rules outside the service (mutable list and Integer equality) and with a Feign call. Downstream error translation lives in the controller.',
    },
  },
];

export const TEST_CLASS_NOTES: TestClassNote[] = [
  {
    className: 'GlobalExceptionHandlerTest',
    moduleId: 'common-exceptions',
    summary: {
      pt: 'Contrato do payload de erro. O advice é exercitado pelo MockMvc standalone, com um controller fictício.',
      en: 'Contract of the error payload. The advice is exercised by standalone MockMvc, with a stub controller.',
    },
  },
  {
    className: 'CustomerMapperTest',
    moduleId: 'customer-microservice',
    summary: {
      pt: 'Sem mock. Fronteira entre o record HTTP e o documento Mongo.',
      en: 'No mocks. The boundary between the HTTP record and the Mongo document.',
    },
  },
  {
    className: 'CustomerServiceTest',
    moduleId: 'customer-microservice',
    summary: {
      pt: 'Repositório mockado e CustomerMapper real. A tradução request/entidade faz parte do comportamento.',
      en: 'Mocked repository and the real CustomerMapper. The request/entity translation is part of the behavior.',
    },
  },
  {
    className: 'CustomerControllerTest',
    moduleId: 'customer-microservice',
    summary: {
      pt: 'Serviço mockado. O assunto é status, corpo e a validação que impede a chamada ao serviço.',
      en: 'Mocked service. The subject is status, body, and the validation that blocks the service call.',
    },
  },
  {
    className: 'MappersTest',
    moduleId: 'product-microservice',
    summary: {
      pt: 'ProductMapper e CategoryMapper juntos, porque a categoria aninha produtos.',
      en: 'ProductMapper and CategoryMapper together, because a category nests products.',
    },
  },
  {
    className: 'ProductServiceTest',
    moduleId: 'product-microservice',
    summary: {
      pt: 'Repositório e CategoryService mockados, mapper real. A categoria é validada antes de gravar o produto.',
      en: 'Mocked repository and CategoryService, real mapper. The category is validated before the product is stored.',
    },
  },
  {
    className: 'CategoryServiceTest',
    moduleId: 'product-microservice',
    summary: {
      pt: 'Unicidade do nome e categoria em uso são regras de negócio, checadas antes do Postgres.',
      en: 'Name uniqueness and a category in use are business rules, checked before Postgres.',
    },
  },
  {
    className: 'ProductControllerTest',
    moduleId: 'product-microservice',
    summary: {
      pt: 'Contrato HTTP do catálogo: JSON, id em texto, 4xx de validação e 500 sem vazar a URL do banco.',
      en: 'HTTP contract of the catalog: JSON, a text id, validation 4xx, and a 500 that does not leak the database URL.',
    },
  },
  {
    className: 'CategoryControllerTest',
    moduleId: 'product-microservice',
    summary: {
      pt: '409 de nome, de categoria em uso e de violação de unique ou foreign key. O texto do Postgres não sai na resposta.',
      en: '409 for a duplicate name, a category in use, and a unique or foreign-key violation. The Postgres text does not leave in the response.',
    },
  },
  {
    className: 'CartTest',
    moduleId: 'cart-microservice',
    summary: {
      pt: 'Regras do domínio, sem mock. Ids 1000 são Integer distintos de propósito, para pegar comparação com ==.',
      en: 'Domain rules, with no mocks. The ids 1000 are distinct Integer instances on purpose, to catch a comparison with ==.',
    },
  },
  {
    className: 'CartServiceTest',
    moduleId: 'cart-microservice',
    summary: {
      pt: 'Feign e repositório mockados. Estoque, cliente desconhecido e falha downstream são decididos aqui.',
      en: 'Mocked Feign and repository. Stock, an unknown customer, and a downstream failure are decided here.',
    },
  },
  {
    className: 'CartControllerTest',
    moduleId: 'cart-microservice',
    summary: {
      pt: 'Contrato HTTP e o CartExceptionHandler. Feign 404 continua 404, 5xx vira 502 e serviço caído vira 503.',
      en: 'HTTP contract and CartExceptionHandler. Feign 404 stays 404, 5xx becomes 502, and a service that is down becomes 503.',
    },
  },
];

export const TEST_CASES: DocTest[] = [
  ...COMMON_EXCEPTION_TESTS,
  ...CUSTOMER_TESTS,
  ...PRODUCT_TESTS,
  ...CART_TESTS,
];

export function classNote(className: string): TestClassNote | undefined {
  return TEST_CLASS_NOTES.find((note) => note.className === className);
}
