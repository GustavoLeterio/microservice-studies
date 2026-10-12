import { EndpointError } from '../../models/system.models';

export const TIMESTAMP = '2026-10-08T14:32:10.123456';
export const CUSTOMER_ID = '6705a1f2c3b4d5e6f7a8b9c0';

export const json = (value: unknown): string => JSON.stringify(value, null, 2);

/** Body of the ErrorResponse record (common-exceptions). */
export const errorResponse = (errors: Record<string, string>, path = '/'): string =>
  json({ errors, timestamp: TIMESTAMP, path });

/** ProblemDetail body (RFC 9457) produced by ResponseEntityExceptionHandler. */
export const problemDetail = (status: number, title: string, detail: string, instance: string): string =>
  json({ type: 'about:blank', title, status, detail, instance });

/** Body of Spring Boot's BasicErrorController (/error). */
export const springBootError = (status: number, error: string, path: string): string =>
  json({ timestamp: '2026-10-08T14:32:10.123+00:00', status, error, path });

// ---------- errors inherited from GlobalExceptionHandler (customer and product) ----------

export const validationError = (fields: Record<string, string>): EndpointError => ({
  status: 400,
  cause: 'A request-body field failed Bean Validation (@Valid). Each invalid field becomes a key in errors.',
  source: 'MethodArgumentNotValidException → GlobalExceptionHandler',
  example: errorResponse(fields),
});

export const bodyMissingError: EndpointError = {
  status: 400,
  cause: 'Missing body, malformed JSON, or an incompatible type (for example, text in a numeric field).',
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
    `"${param}" is not numeric (for example, /abc). MethodArgumentTypeMismatchException has no dedicated handler and falls through to the catch-all.`,
  );

// ---------- cart-microservice errors ----------

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
      ? 'The customer does not exist (customer-microservice responded 404) or the service is unavailable. Without dismiss404, Feign throws FeignException instead of returning an empty Optional.'
      : 'The product does not exist (product-microservice responded 404) or the service is unavailable. The remote 404 arrives as a FeignException.',
    source: 'FeignException → CartExceptionHandler.handleFeignException',
    example: errorResponse(
      { error: `[404] during [GET] to [http://${service}${remotePath}] [${method}]: [${remoteBody}]` },
      '/api/v1/carts',
    ),
  };
};

export const cartValidationError = (instance: string): EndpointError => ({
  status: 400,
  cause: 'productId or quantity is missing, or quantity < 1. Handled by the ResponseEntityExceptionHandler base class, which responds with ProblemDetail (without per-field detail).',
  source: 'MethodArgumentNotValidException → ResponseEntityExceptionHandler',
  example: problemDetail(400, 'Bad Request', 'Invalid request content.', instance),
});

export const cartBodyMissingError = (instance: string): EndpointError => ({
  status: 400,
  cause: 'Missing body or malformed JSON.',
  source: 'HttpMessageNotReadableException → ResponseEntityExceptionHandler',
  example: problemDetail(400, 'Bad Request', 'Failed to read request', instance),
});
