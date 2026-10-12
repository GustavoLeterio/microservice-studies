import { EndpointError } from '../../models/system.models';

export const TIMESTAMP = '2026-10-08T14:32:10.123456';
export const CUSTOMER_ID = '6705a1f2c3b4d5e6f7a8b9c0';

export const json = (value: unknown): string => JSON.stringify(value, null, 2);

/** Corpo do record ErrorResponse (common-exceptions). */
export const errorResponse = (errors: Record<string, string>, path = '/'): string =>
  json({ errors, timestamp: TIMESTAMP, path });

/** Corpo ProblemDetail (RFC 9457) gerado pelo ResponseEntityExceptionHandler. */
export const problemDetail = (status: number, title: string, detail: string, instance: string): string =>
  json({ type: 'about:blank', title, status, detail, instance });

/** Corpo do BasicErrorController (/error) do Spring Boot. */
export const springBootError = (status: number, error: string, path: string): string =>
  json({ timestamp: '2026-10-08T14:32:10.123+00:00', status, error, path });

// ---------- erros herdados do GlobalExceptionHandler (customer e product) ----------

export const validationError = (fields: Record<string, string>): EndpointError => ({
  status: 400,
  cause: 'Algum campo do corpo não passou na Bean Validation (@Valid). Cada campo inválido vira uma chave em errors.',
  source: 'MethodArgumentNotValidException → GlobalExceptionHandler',
  example: errorResponse(fields),
});

export const bodyMissingError: EndpointError = {
  status: 400,
  cause: 'Corpo ausente, JSON malformado ou tipo incompatível (ex.: texto em campo numérico).',
  source: 'HttpMessageNotReadableException → GlobalExceptionHandler',
  example: errorResponse({ error: 'Request body is missing' }),
};

export const unexpectedError = (cause: string): EndpointError => ({
  status: 500,
  cause,
  source: 'Exception → GlobalExceptionHandler (catch-all)',
  example: errorResponse({ error: 'An unexpected error occurred' }),
});

export const typeMismatchError = (param: string): EndpointError =>
  unexpectedError(
    `"${param}" não numérico (ex.: /abc). O MethodArgumentTypeMismatchException não tem handler específico e cai no catch-all.`,
  );

// ---------- erros do cart-microservice ----------

export const feignError = (target: 'customer' | 'product', id: string): EndpointError => {
  const isCustomer = target === 'customer';
  const service = isCustomer ? 'CUSTOMER-MICROSERVICE' : 'PRODUCT-MICROSERVICE';
  const remotePath = isCustomer ? `/api/v1/customers/${id}` : `/api/v1/products/${id}`;
  const method = isCustomer ? 'CustomerClient#getCustomerById(String)' : 'ProductClient#getProductById(Integer)';
  const remoteBody = JSON.stringify({
    errors: { [target]: `${isCustomer ? 'Customer' : 'Product'} not found with id: ${id}` },
    timestamp: TIMESTAMP,
    path: '/',
  });
  return {
    status: 400,
    cause: isCustomer
      ? 'O cliente não existe (o customer-microservice respondeu 404) ou o serviço está indisponível. Sem dismiss404, o Feign lança FeignException em vez de devolver Optional vazio.'
      : 'O produto não existe (o product-microservice respondeu 404) ou o serviço está indisponível. O 404 remoto chega como FeignException.',
    source: 'FeignException → CartExceptionHandler.handleFeignException',
    example: errorResponse(
      { error: `[404] during [GET] to [http://${service}${remotePath}] [${method}]: [${remoteBody}]` },
      '/api/v1/carts',
    ),
  };
};

export const cartValidationError = (instance: string): EndpointError => ({
  status: 400,
  cause: 'productId ou quantity ausentes, ou quantity < 1. Tratado pela classe base ResponseEntityExceptionHandler, que responde em ProblemDetail (sem o detalhe por campo).',
  source: 'MethodArgumentNotValidException → ResponseEntityExceptionHandler',
  example: problemDetail(400, 'Bad Request', 'Invalid request content.', instance),
});

export const cartBodyMissingError = (instance: string): EndpointError => ({
  status: 400,
  cause: 'Corpo ausente ou JSON malformado.',
  source: 'HttpMessageNotReadableException → ResponseEntityExceptionHandler',
  example: problemDetail(400, 'Bad Request', 'Failed to read request', instance),
});
