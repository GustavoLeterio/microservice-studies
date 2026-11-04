import { docTest } from './doc-test';
import { DocTest } from './test.models';

const FILE =
  'microservices/common-exceptions/src/test/java/com/gustavoleterio/microservices/common_exceptions/GlobalExceptionHandlerTest.java';
const CLASS = 'GlobalExceptionHandlerTest';
const MODULE = 'common-exceptions' as const;

export const COMMON_EXCEPTION_TESTS: DocTest[] = [
  docTest(
    'com-hnd-01',
    MODULE,
    CLASS,
    'invalidPayloadReturns400WithFieldErrors',
    {
      pt: 'Falha de Bean Validation devolve 400 com o mapa campo → mensagem e o path real da request.',
      en: 'A Bean Validation failure returns 400 with a field → message map and the real request path.',
    },
    {
      pt: 'O cliente precisa saber qual campo falhou. O path não pode ser uma string fixa no handler.',
      en: 'The client needs to know which field failed. The path cannot be a string hardcoded in the handler.',
    },
    `mockMvc.perform(post("/stub/validate")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\\"name\\":\\"  \\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.name").value("name is required"))
        .andExpect(jsonPath("$.path").value("/stub/validate"))
        .andExpect(jsonPath("$.timestamp").value(not(emptyOrNullString())));`,
    FILE,
    'COM-HND-01',
  ),
  docTest(
    'com-hnd-02',
    MODULE,
    CLASS,
    'missingBodyReturns400WithSpecificMessage',
    {
      pt: 'POST sem corpo devolve 400 com a mensagem "Request body is missing".',
      en: 'A POST without a body returns 400 with the message "Request body is missing".',
    },
    {
      pt: 'Corpo ausente e JSON inválido são erros diferentes. O cliente precisa da mensagem específica para distinguir os dois.',
      en: 'A missing body and invalid JSON are different errors. The client needs a specific message to tell them apart.',
    },
    `mockMvc.perform(post("/stub/validate").contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.error").value("Request body is missing"))
        .andExpect(jsonPath("$.path").value("/stub/validate"));`,
    FILE,
    'COM-HND-02',
  ),
  docTest(
    'com-hnd-02-malformed',
    MODULE,
    CLASS,
    'malformedJsonReturns400WithDistinctMessage',
    {
      pt: 'JSON malformado devolve 400 com a mensagem de corpo inválido.',
      en: 'Malformed JSON returns 400 with the invalid-body message.',
    },
    {
      pt: 'Regressão: {"name": já foi reportado como corpo ausente. A mensagem agora é outra, para não esconder um JSON quebrado.',
      en: 'Regression: {"name": used to be reported as a missing body. The message is now distinct, so a broken JSON payload is not hidden.',
    },
    `mockMvc.perform(post("/stub/validate")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\\"name\\": "))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.error")
            .value("Request body is malformed or has invalid values"));`,
    FILE,
    'COM-HND-02',
  ),
  docTest(
    'com-hnd-03',
    MODULE,
    CLASS,
    'unexpectedExceptionReturnsGeneric500',
    {
      pt: 'Exceção inesperada vira 500 genérico, sem o detalhe interno.',
      en: 'An unexpected exception becomes a generic 500, without the internal detail.',
    },
    {
      pt: 'IllegalStateException("secret-internal-detail") não pode vazar stack, senha ou mensagem interna para quem chamou a API.',
      en: 'IllegalStateException("secret-internal-detail") must not leak a stack trace, a password, or an internal message to the API caller.',
    },
    `mockMvc.perform(get("/stub/boom"))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.errors.error").value("An unexpected error occurred"))
        .andExpect(jsonPath("$.path").value("/stub/boom"));
// o corpo da resposta não contém "secret-internal-detail"`,
    FILE,
    'COM-HND-03',
  ),
  docTest(
    'com-hnd-04',
    MODULE,
    CLASS,
    'pathReflectsRequestUri',
    {
      pt: 'O path do payload de erro segue a URI da request.',
      en: 'The path in the error payload follows the request URI.',
    },
    {
      pt: 'Trava um handler que devolvia "/" fixo. O mesmo boom em /stub/boom grava esse path.',
      en: 'Locks a handler that used to return a hardcoded "/". The same failure on /stub/boom records that path.',
    },
    `mockMvc.perform(get("/stub/boom"))
        .andExpect(jsonPath("$.path").value(containsString("/stub/boom")))
        .andExpect(jsonPath("$.path").value(not("/")));`,
    FILE,
    'COM-HND-04',
  ),
  docTest(
    'com-hnd-05',
    MODULE,
    CLASS,
    'typeMismatchReturns400',
    {
      pt: 'Path variable com tipo errado devolve 400, com errors.id.',
      en: 'A path variable of the wrong type returns 400, with errors.id.',
    },
    {
      pt: 'GET /stub/items/abc com @PathVariable Integer já caía no catch-all e virava 500. Erro de cliente tem que continuar 400.',
      en: 'GET /stub/items/abc with @PathVariable Integer used to fall into the catch-all and become 500. A client error has to stay 400.',
    },
    `mockMvc.perform(get("/stub/items/abc"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.id").value("Invalid value for parameter 'id'"))
        .andExpect(jsonPath("$.path").value("/stub/items/abc"));`,
    FILE,
    'COM-HND-05',
  ),
  docTest(
    'com-hnd-06',
    MODULE,
    CLASS,
    'methodNotAllowedKeeps405',
    {
      pt: 'Método HTTP não suportado conserva o 405.',
      en: 'An unsupported HTTP method keeps status 405.',
    },
    {
      pt: 'POST /stub/boom só tem GET. O catch-all chegou a transformar todo erro de cliente em 500.',
      en: 'POST /stub/boom only has a GET. The catch-all once turned every client error into 500.',
    },
    `mockMvc.perform(post("/stub/boom"))
        .andExpect(status().isMethodNotAllowed())
        .andExpect(jsonPath("$.errors.error").exists())
        .andExpect(jsonPath("$.path").value("/stub/boom"));`,
    FILE,
    'COM-HND-06',
  ),
  docTest(
    'com-hnd-415',
    MODULE,
    CLASS,
    'unsupportedMediaTypeKeeps415',
    {
      pt: 'Content-Type não suportado conserva o 415.',
      en: 'An unsupported content type keeps status 415.',
    },
    {
      pt: 'Mesma razão do 405: o status que o Spring já escolheu para o cliente não pode ser reescrito pelo handler genérico.',
      en: 'Same reason as 405: the status Spring already chose for the client must not be rewritten by the generic handler.',
    },
    `mockMvc.perform(post("/stub/validate")
        .contentType(MediaType.TEXT_PLAIN)
        .content("name=x"))
        .andExpect(status().isUnsupportedMediaType());`,
    FILE,
  ),
];
