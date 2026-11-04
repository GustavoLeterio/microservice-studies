import { docTest } from './doc-test';
import { DocTest } from './test.models';

const MAPPER_FILE =
  'microservices/customer-microservice/src/test/java/com/gustavoleterio/microservices/customer_microservice/customer/CustomerMapperTest.java';
const SERVICE_FILE =
  'microservices/customer-microservice/src/test/java/com/gustavoleterio/microservices/customer_microservice/customer/CustomerServiceTest.java';
const CONTROLLER_FILE =
  'microservices/customer-microservice/src/test/java/com/gustavoleterio/microservices/customer_microservice/customer/CustomerControllerTest.java';

const MODULE = 'customer-microservice' as const;

export const CUSTOMER_TESTS: DocTest[] = [
  docTest(
    'cus-map-01',
    MODULE,
    'CustomerMapperTest',
    'toCustomer',
    {
      pt: 'O request vira entidade com todos os campos e com o id vazio.',
      en: 'The request becomes an entity with every field copied and the id left empty.',
    },
    {
      pt: 'O id nasce no Mongo. Se o mapper copiasse um id vindo do cliente, o create poderia sobrescrever outro documento.',
      en: 'The id is born in Mongo. If the mapper copied an id from the client, create could overwrite another document.',
    },
    `Customer customer = mapper.toCustomer(
        new CustomerRequest("John", "Doe", "john@doe.com", "123", "Street 1", "Springfield"));

assertThat(customer.getId()).isNull();
assertThat(customer.getFirstName()).isEqualTo("John");
assertThat(customer.getEmail()).isEqualTo("john@doe.com");`,
    MAPPER_FILE,
    'CUS-MAP-01',
  ),
  docTest(
    'cus-map-response',
    MODULE,
    'CustomerMapperTest',
    'toCustomerResponse',
    {
      pt: 'A resposta copia todos os campos da entidade, inclusive o id.',
      en: 'The response copies every entity field, including the id.',
    },
    {
      pt: 'O contrato de leitura tem que devolver o que foi persistido. Sem o id, o cliente não consegue endereçar o recurso.',
      en: 'The read contract has to return what was stored. Without the id, the client cannot address the resource.',
    },
    `CustomerResponse response = mapper.toCustomerResponse(customer);

assertThat(response).isEqualTo(new CustomerResponse(
        "1", "John", "Doe", "john@doe.com", "123", "Street 1", "Springfield"));`,
    MAPPER_FILE,
  ),
  docTest(
    'cus-map-optional',
    MODULE,
    'CustomerMapperTest',
    'optionalFieldsStayNull',
    {
      pt: 'Telefone, endereço e cidade nulos continuam nulos.',
      en: 'Null phone, address, and city stay null.',
    },
    {
      pt: 'Esses campos são opcionais. O mapper não pode inventar string vazia no lugar de ausência.',
      en: 'Those fields are optional. The mapper must not invent an empty string where the value is absent.',
    },
    `Customer customer = mapper.toCustomer(
        new CustomerRequest("John", "Doe", "john@doe.com", null, null, null));

assertThat(customer.getPhone()).isNull();
assertThat(customer.getAddress()).isNull();
assertThat(customer.getCity()).isNull();`,
    MAPPER_FILE,
  ),
  docTest(
    'cus-svc-01',
    MODULE,
    'CustomerServiceTest',
    'createCustomer',
    {
      pt: 'create persiste a entidade mapeada e devolve o id gerado.',
      en: 'create persists the mapped entity and returns the generated id.',
    },
    {
      pt: 'O id da resposta tem que ser o que o banco gravou, e nome, sobrenome, e-mail e telefone têm que chegar na entidade.',
      en: 'The id in the response has to be the one the database stored, and name, email, and phone have to reach the entity.',
    },
    `when(repository.save(any(Customer.class))).thenAnswer(inv -> {
    Customer saved = inv.getArgument(0);
    saved.setId("generated-id");
    return saved;
});

String id = service.createCustomer(request("999"));

assertThat(id).isEqualTo("generated-id");
assertThat(captor.getValue().getFirstName()).isEqualTo("John");
assertThat(captor.getValue().getEmail()).isEqualTo("john@doe.com");
assertThat(captor.getValue().getPhone()).isEqualTo("999");`,
    SERVICE_FILE,
    'CUS-SVC-01',
  ),
  docTest(
    'cus-svc-02',
    MODULE,
    'CustomerServiceTest',
    'getCustomerById',
    {
      pt: 'get devolve o response mapeado do documento armazenado.',
      en: 'get returns the response mapped from the stored document.',
    },
    {
      pt: 'É o caminho de leitura que o carrinho consulta via Feign. Id, e-mail e cidade precisam sair no contrato.',
      en: 'This is the read path the cart calls through Feign. Id, email, and city have to leave on the contract.',
    },
    `when(repository.findById("1")).thenReturn(Optional.of(stored("1")));

CustomerResponse response = service.getCustomerById("1");

assertThat(response.id()).isEqualTo("1");
assertThat(response.email()).isEqualTo("old@mail.com");
assertThat(response.city()).isEqualTo("Old city");`,
    SERVICE_FILE,
    'CUS-SVC-02',
  ),
  docTest(
    'cus-svc-get-missing',
    MODULE,
    'CustomerServiceTest',
    'getCustomerByIdNotFound',
    {
      pt: 'Id inexistente lança CustomerNotFoundException com o id na mensagem.',
      en: 'An unknown id throws CustomerNotFoundException with the id in the message.',
    },
    {
      pt: 'A mensagem carrega o id para o handler montar o 404. Optional vazio não pode virar null no response.',
      en: 'The message carries the id so the handler can build the 404. An empty Optional must not become a null response.',
    },
    `when(repository.findById("ghost")).thenReturn(Optional.empty());

assertThatThrownBy(() -> service.getCustomerById("ghost"))
        .isInstanceOf(CustomerNotFoundException.class)
        .hasMessage("Customer not found with id: ghost");`,
    SERVICE_FILE,
  ),
  docTest(
    'cus-svc-03',
    MODULE,
    'CustomerServiceTest',
    'updateCustomerReplacesAllFieldsKeepingId',
    {
      pt: 'O update troca os campos e conserva o id do path.',
      en: 'Update replaces the fields and keeps the path id.',
    },
    {
      pt: 'PUT não pode trocar a chave do documento. O body pede John e telefone 999; o id salvo continua "1".',
      en: 'PUT must not change the document key. The body asks for John and phone 999; the saved id stays "1".',
    },
    `String id = service.updateCustomer(request("999"), "1");

assertThat(id).isEqualTo("1");
assertThat(captor.getValue().getId()).isEqualTo("1");
assertThat(captor.getValue().getFirstName()).isEqualTo("John");
assertThat(captor.getValue().getPhone()).isEqualTo("999");`,
    SERVICE_FILE,
    'CUS-SVC-03',
  ),
  docTest(
    'cus-svc-put-nulls',
    MODULE,
    'CustomerServiceTest',
    'updateCustomerWithNullOptionalFieldsOverwritesStoredValues',
    {
      pt: 'PUT é substituição completa: opcionais omitidos gravam null por cima do valor antigo.',
      en: 'PUT is a full replace: omitted optional fields overwrite the stored value with null.',
    },
    {
      pt: 'Documenta o contrato. Campo ausente apaga telefone, endereço e cidade. Não é um PATCH parcial.',
      en: 'Documents the contract. A missing field clears phone, address, and city. This is not a partial PATCH.',
    },
    `service.updateCustomer(
        new CustomerRequest("John", "Doe", "john@doe.com", null, null, null), "1");

assertThat(captor.getValue().getPhone()).isNull();
assertThat(captor.getValue().getAddress()).isNull();
assertThat(captor.getValue().getCity()).isNull();`,
    SERVICE_FILE,
  ),
  docTest(
    'cus-svc-update-missing',
    MODULE,
    'CustomerServiceTest',
    'updateCustomerNotFound',
    {
      pt: 'Update de id desconhecido falha e não chama save.',
      en: 'Updating an unknown id fails and never calls save.',
    },
    {
      pt: 'Falhar depois do save criaria um documento órfão. O repositório não pode ser escrito se o cliente não existe.',
      en: 'Failing after save would create an orphan document. The repository must not be written when the customer does not exist.',
    },
    `when(repository.findById("ghost")).thenReturn(Optional.empty());

assertThatThrownBy(() -> service.updateCustomer(request("1"), "ghost"))
        .isInstanceOf(CustomerNotFoundException.class);
verify(repository, never()).save(any());`,
    SERVICE_FILE,
  ),
  docTest(
    'cus-svc-04',
    MODULE,
    'CustomerServiceTest',
    'deleteCustomer',
    {
      pt: 'Delete remove o cliente que existe.',
      en: 'Delete removes a customer that exists.',
    },
    {
      pt: 'O serviço só apaga depois de achar o documento. deleteById("1") é o efeito observável.',
      en: 'The service deletes only after it finds the document. deleteById("1") is the observable effect.',
    },
    `when(repository.findById("1")).thenReturn(Optional.of(stored("1")));

service.deleteCustomer("1");

verify(repository).deleteById("1");`,
    SERVICE_FILE,
    'CUS-SVC-04',
  ),
  docTest(
    'cus-svc-delete-missing',
    MODULE,
    'CustomerServiceTest',
    'deleteCustomerNotFound',
    {
      pt: 'Delete de id desconhecido falha e não apaga.',
      en: 'Deleting an unknown id fails and never deletes.',
    },
    {
      pt: 'Apagar no escuro esconderia um id errado. A exceção acontece e deleteById não é chamado.',
      en: 'Deleting in the dark would hide a wrong id. The exception is thrown and deleteById is not called.',
    },
    `when(repository.findById("ghost")).thenReturn(Optional.empty());

assertThatThrownBy(() -> service.deleteCustomer("ghost"))
        .isInstanceOf(CustomerNotFoundException.class);
verify(repository, never()).deleteById(any());`,
    SERVICE_FILE,
  ),
  docTest(
    'cus-svc-list',
    MODULE,
    'CustomerServiceTest',
    'getAllCustomers',
    {
      pt: 'A lista mapeia cada documento armazenado, na ordem.',
      en: 'The list maps every stored document, in order.',
    },
    {
      pt: 'Dois documentos viram responses "1" e "2". A listagem é o contrato que o GET /all devolve.',
      en: 'Two documents become responses "1" and "2". The listing is the contract GET /all returns.',
    },
    `when(repository.findAll()).thenReturn(List.of(stored("1"), stored("2")));

assertThat(service.getAllCustomers())
        .extracting(CustomerResponse::id)
        .containsExactly("1", "2");`,
    SERVICE_FILE,
  ),
  docTest(
    'cus-svc-list-empty',
    MODULE,
    'CustomerServiceTest',
    'getAllCustomersEmpty',
    {
      pt: 'Coleção vazia devolve lista vazia.',
      en: 'An empty collection returns an empty list.',
    },
    {
      pt: 'Não ter clientes é um estado válido. findAll vazio não pode virar exceção nem null.',
      en: 'Having no customers is a valid state. An empty findAll must not become an exception or null.',
    },
    `when(repository.findAll()).thenReturn(List.of());

assertThat(service.getAllCustomers()).isEmpty();`,
    SERVICE_FILE,
  ),
  docTest(
    'cus-ctl-01',
    MODULE,
    'CustomerControllerTest',
    'getCustomer',
    {
      pt: 'GET /{id} devolve 200 com id e e-mail.',
      en: 'GET /{id} returns 200 with id and email.',
    },
    {
      pt: 'O controller é a borda HTTP. Este teste trava o JSON de sucesso, com o serviço mockado.',
      en: 'The controller is the HTTP edge. This test locks the success JSON, with the service mocked.',
    },
    `when(service.getCustomerById("1")).thenReturn(response("1"));

mockMvc.perform(get(BASE + "/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("1"))
        .andExpect(jsonPath("$.email").value("john@doe.com"));`,
    CONTROLLER_FILE,
    'CUS-CTL-01',
  ),
  docTest(
    'cus-ctl-get-404',
    MODULE,
    'CustomerControllerTest',
    'getCustomerNotFound',
    {
      pt: 'GET de cliente inexistente devolve 404, errors.customer e o path real.',
      en: 'GET of a missing customer returns 404, errors.customer, and the real path.',
    },
    {
      pt: 'O campo do erro é customer, não um error genérico. O path sai da URI, para o cliente saber qual recurso faltou.',
      en: 'The error field is customer, not a generic error. The path comes from the URI, so the client knows which resource was missing.',
    },
    `when(service.getCustomerById("ghost"))
        .thenThrow(new CustomerNotFoundException("Customer not found with id: ghost"));

mockMvc.perform(get(BASE + "/ghost"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.errors.customer").value("Customer not found with id: ghost"))
        .andExpect(jsonPath("$.path").value(BASE + "/ghost"));`,
    CONTROLLER_FILE,
  ),
  docTest(
    'cus-ctl-list',
    MODULE,
    'CustomerControllerTest',
    'getAllCustomers',
    {
      pt: 'GET /all devolve a lista, com o segundo id em $[1].id.',
      en: 'GET /all returns the list, with the second id at $[1].id.',
    },
    {
      pt: 'Confere que a coleção inteira atravessa o JSON e que a ordem do serviço chega na resposta.',
      en: 'Checks that the whole collection crosses into JSON and that the service order reaches the response.',
    },
    `when(service.getAllCustomers()).thenReturn(List.of(response("1"), response("2")));

mockMvc.perform(get(BASE + "/all"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[1].id").value("2"));`,
    CONTROLLER_FILE,
  ),
  docTest(
    'cus-ctl-02',
    MODULE,
    'CustomerControllerTest',
    'createCustomer',
    {
      pt: 'POST devolve o id em texto, com status 200.',
      en: 'POST returns the id as text, with status 200.',
    },
    {
      pt: 'O create deste serviço não devolve JSON. O corpo é o id puro. Um objeto quebraria o cliente.',
      en: 'Create on this service does not return JSON. The body is the raw id. An object would break the client.',
    },
    `when(service.createCustomer(any(CustomerRequest.class))).thenReturn("new-id");

mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
        .andExpect(status().isOk())
        .andExpect(content().string("new-id"));`,
    CONTROLLER_FILE,
    'CUS-CTL-02',
  ),
  docTest(
    'cus-ctl-post-invalid',
    MODULE,
    'CustomerControllerTest',
    'createRejectsInvalidBody',
    {
      pt: 'POST rejeita firstName vazio ou ausente, lastName vazio, e-mail ausente e e-mail malformado.',
      en: 'POST rejects a blank or missing firstName, a blank lastName, a missing email, and a malformed email.',
    },
    {
      pt: 'A validação tem que morrer no controller. Cada caso exige 400, errors no campo certo e o serviço intocado.',
      en: 'Validation has to die in the controller. Each case requires 400, an error on the right field, and the service left untouched.',
    },
    `@ParameterizedTest(name = "POST rejects {0}")
@MethodSource("invalidBodies")
void createRejectsInvalidBody(String description, String field, String json) throws Exception {
    mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(json))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors." + field).exists())
            .andExpect(jsonPath("$.path").value(BASE));

    verifyNoInteractions(service);
}`,
    CONTROLLER_FILE,
  ),
  docTest(
    'cus-ctl-post-empty',
    MODULE,
    'CustomerControllerTest',
    'createWithoutBody',
    {
      pt: 'POST sem corpo devolve 400 com "Request body is missing".',
      en: 'POST without a body returns 400 with "Request body is missing".',
    },
    {
      pt: 'Amarra o COM-HND-02 no endpoint real de cliente. O serviço não é chamado.',
      en: 'Ties COM-HND-02 to the real customer endpoint. The service is not called.',
    },
    `mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.error").value("Request body is missing"));

verifyNoInteractions(service);`,
    CONTROLLER_FILE,
  ),
  docTest(
    'cus-ctl-03',
    MODULE,
    'CustomerControllerTest',
    'updateCustomer',
    {
      pt: 'PUT devolve 202 com corpo vazio e repassa o id do path.',
      en: 'PUT returns 202 with an empty body and forwards the path id.',
    },
    {
      pt: '202 sem JSON é o contrato deste update. O teste também confere que o e-mail do body e o id "1" chegam no serviço.',
      en: '202 with no JSON is this update contract. The test also checks that the body email and the id "1" reach the service.',
    },
    `when(service.updateCustomer(any(CustomerRequest.class), eq("1"))).thenReturn("1");

mockMvc.perform(put(BASE + "/1").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
        .andExpect(status().isAccepted())
        .andExpect(content().string(""));

verify(service).updateCustomer(argThat(r -> r.email().equals("john@doe.com")), eq("1"));`,
    CONTROLLER_FILE,
    'CUS-CTL-03',
  ),
  docTest(
    'cus-ctl-put-404',
    MODULE,
    'CustomerControllerTest',
    'updateCustomerNotFound',
    {
      pt: 'PUT de id desconhecido devolve 404.',
      en: 'PUT of an unknown id returns 404.',
    },
    {
      pt: 'O controller não pode transformar CustomerNotFoundException em 500. O status de negócio atravessa o HTTP.',
      en: 'The controller must not turn CustomerNotFoundException into 500. The business status crosses into HTTP.',
    },
    `when(service.updateCustomer(any(CustomerRequest.class), eq("ghost")))
        .thenThrow(new CustomerNotFoundException("Customer not found with id: ghost"));

mockMvc.perform(put(BASE + "/ghost").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
        .andExpect(status().isNotFound());`,
    CONTROLLER_FILE,
  ),
  docTest(
    'cus-ctl-put-invalid',
    MODULE,
    'CustomerControllerTest',
    'updateCustomerInvalidBody',
    {
      pt: 'PUT com e-mail inválido devolve 400 e não chama o serviço.',
      en: 'PUT with an invalid email returns 400 and does not call the service.',
    },
    {
      pt: 'A mesma validação do POST vale no update. errors.email traz "Invalid email address".',
      en: 'The same validation as POST applies on update. errors.email carries "Invalid email address".',
    },
    `mockMvc.perform(put(BASE + "/1").contentType(MediaType.APPLICATION_JSON)
        .content("{\\"firstName\\":\\"John\\",\\"lastName\\":\\"Doe\\",\\"email\\":\\"bad\\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.email").value("Invalid email address"));

verifyNoInteractions(service);`,
    CONTROLLER_FILE,
  ),
  docTest(
    'cus-ctl-04',
    MODULE,
    'CustomerControllerTest',
    'deleteCustomer',
    {
      pt: 'DELETE devolve 202 e chama deleteCustomer com o id do path.',
      en: 'DELETE returns 202 and calls deleteCustomer with the path id.',
    },
    {
      pt: 'O status deste delete é 202, igual ao update. O teste existe para esse contrato não virar 200 ou 204 por engano.',
      en: 'This delete status is 202, same as update. The test exists so that contract does not become 200 or 204 by mistake.',
    },
    `mockMvc.perform(delete(BASE + "/1"))
        .andExpect(status().isAccepted());

verify(service).deleteCustomer("1");`,
    CONTROLLER_FILE,
    'CUS-CTL-04',
  ),
  docTest(
    'cus-ctl-delete-404',
    MODULE,
    'CustomerControllerTest',
    'deleteCustomerNotFound',
    {
      pt: 'DELETE de id desconhecido devolve 404 com o path da URI.',
      en: 'DELETE of an unknown id returns 404 with the URI path.',
    },
    {
      pt: 'O path do erro é a URI do ghost, não um valor fixo no handler.',
      en: 'The error path is the ghost URI, not a value hardcoded in the handler.',
    },
    `doThrow(new CustomerNotFoundException("Customer not found with id: ghost"))
        .when(service).deleteCustomer("ghost");

mockMvc.perform(delete(BASE + "/ghost"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.path").value(BASE + "/ghost"));`,
    CONTROLLER_FILE,
  ),
  docTest(
    'cus-ctl-500',
    MODULE,
    'CustomerControllerTest',
    'unexpectedFailureIsGeneric500',
    {
      pt: 'Falha inesperada vira 500 genérico, sem a mensagem interna.',
      en: 'An unexpected failure becomes a generic 500, without the internal message.',
    },
    {
      pt: 'Repete o COM-HND-03 no controller que o cliente realmente chama. "mongo password leaked" não aparece no corpo.',
      en: 'Repeats COM-HND-03 on the controller the client actually calls. "mongo password leaked" does not appear in the body.',
    },
    `when(service.getCustomerById("1"))
        .thenThrow(new IllegalStateException("mongo password leaked"));

mockMvc.perform(get(BASE + "/1"))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.errors.error").value("An unexpected error occurred"));
// o corpo não contém "leaked"`,
    CONTROLLER_FILE,
  ),
];
