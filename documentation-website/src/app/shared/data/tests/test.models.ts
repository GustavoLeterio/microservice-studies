export interface TestText {
  pt: string;
  en: string;
}

export type TestModuleId =
  | 'common-exceptions'
  | 'customer-microservice'
  | 'product-microservice'
  | 'cart-microservice';

/** Um método de teste, com o que ele verifica, por que existe e o código real. */
export interface DocTest {
  id: string;
  anchor?: string;
  moduleId: TestModuleId;
  className: string;
  method: string;
  summary: TestText;
  reason: TestText;
  code: string;
  file: string;
}

export interface TestModuleDoc {
  id: TestModuleId;
  name: TestText;
  summary: TestText;
}

export interface TestClassNote {
  className: string;
  moduleId: TestModuleId;
  summary: TestText;
}
