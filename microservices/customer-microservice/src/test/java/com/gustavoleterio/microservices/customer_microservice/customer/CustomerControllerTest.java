package com.gustavoleterio.microservices.customer_microservice.customer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.gustavoleterio.microservices.customer_microservice.exceptions.CustomerExceptionHandler;
import com.gustavoleterio.microservices.customer_microservice.exceptions.CustomerNotFoundException;

class CustomerControllerTest {

    private static final String BASE = "/api/v1/customers";
    private static final String VALID_BODY = """
            {"firstName":"John","lastName":"Doe","email":"john@doe.com","phone":"123","address":"Street 1","city":"Springfield"}
            """;

    private CustomerService service;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(CustomerService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new CustomerController(service))
                .setControllerAdvice(new CustomerExceptionHandler())
                .build();
    }

    private static CustomerResponse response(String id) {
        return new CustomerResponse(id, "John", "Doe", "john@doe.com", "123", "Street 1", "Springfield");
    }

    // ---------- GET ----------

    // CUS-CTL-01
    @Test
    @DisplayName("GET /{id} returns the customer")
    void getCustomer() throws Exception {
        when(service.getCustomerById("1")).thenReturn(response("1"));

        mockMvc.perform(get(BASE + "/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("1"))
                .andExpect(jsonPath("$.email").value("john@doe.com"));
    }

    @Test
    @DisplayName("GET /{id} returns 404 with the real path when the customer does not exist")
    void getCustomerNotFound() throws Exception {
        when(service.getCustomerById("ghost")).thenThrow(new CustomerNotFoundException("Customer not found with id: ghost"));

        mockMvc.perform(get(BASE + "/ghost"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errors.customer").value("Customer not found with id: ghost"))
                .andExpect(jsonPath("$.path").value(BASE + "/ghost"));
    }

    @Test
    @DisplayName("GET /all returns every customer")
    void getAllCustomers() throws Exception {
        when(service.getAllCustomers()).thenReturn(List.of(response("1"), response("2")));

        mockMvc.perform(get(BASE + "/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].id").value("2"));
    }

    // ---------- POST ----------

    // CUS-CTL-02
    @Test
    @DisplayName("POST creates the customer and returns its id")
    void createCustomer() throws Exception {
        when(service.createCustomer(any(CustomerRequest.class))).thenReturn("new-id");

        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isOk())
                .andExpect(content().string("new-id"));
    }

    static Stream<Arguments> invalidBodies() {
        return Stream.of(
                Arguments.of("blank firstName", "firstName",
                        "{\"firstName\":\" \",\"lastName\":\"Doe\",\"email\":\"a@b.com\"}"),
                Arguments.of("missing firstName", "firstName", "{\"lastName\":\"Doe\",\"email\":\"a@b.com\"}"),
                Arguments.of("blank lastName", "lastName",
                        "{\"firstName\":\"John\",\"lastName\":\"\",\"email\":\"a@b.com\"}"),
                Arguments.of("missing email", "email", "{\"firstName\":\"John\",\"lastName\":\"Doe\"}"),
                Arguments.of("malformed email", "email",
                        "{\"firstName\":\"John\",\"lastName\":\"Doe\",\"email\":\"not-an-email\"}"));
    }

    @ParameterizedTest(name = "POST rejects {0}")
    @MethodSource("invalidBodies")
    void createRejectsInvalidBody(String description, String field, String json) throws Exception {
        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors." + field).exists())
                .andExpect(jsonPath("$.path").value(BASE));

        verifyNoInteractions(service);
    }

    @Test
    @DisplayName("POST without a body returns 400")
    void createWithoutBody() throws Exception {
        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.error").value("Request body is missing"));

        verifyNoInteractions(service);
    }

    // ---------- PUT ----------

    // CUS-CTL-03
    @Test
    @DisplayName("PUT delegates to the service with the path id and answers 202 with an empty body")
    void updateCustomer() throws Exception {
        when(service.updateCustomer(any(CustomerRequest.class), eq("1"))).thenReturn("1");

        mockMvc.perform(put(BASE + "/1").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isAccepted())
                .andExpect(content().string(""));

        verify(service).updateCustomer(org.mockito.ArgumentMatchers.argThat(r -> r.email().equals("john@doe.com")),
                eq("1"));
    }

    @Test
    @DisplayName("PUT returns 404 when the customer does not exist")
    void updateCustomerNotFound() throws Exception {
        when(service.updateCustomer(any(CustomerRequest.class), eq("ghost")))
                .thenThrow(new CustomerNotFoundException("Customer not found with id: ghost"));

        mockMvc.perform(put(BASE + "/ghost").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT with an invalid body returns 400 and does not call the service")
    void updateCustomerInvalidBody() throws Exception {
        mockMvc.perform(put(BASE + "/1").contentType(MediaType.APPLICATION_JSON)
                .content("{\"firstName\":\"John\",\"lastName\":\"Doe\",\"email\":\"bad\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").value("Invalid email address"));

        verifyNoInteractions(service);
    }

    // ---------- DELETE ----------

    // CUS-CTL-04
    @Test
    @DisplayName("DELETE removes the customer and answers 202")
    void deleteCustomer() throws Exception {
        mockMvc.perform(delete(BASE + "/1"))
                .andExpect(status().isAccepted());

        verify(service).deleteCustomer("1");
    }

    @Test
    @DisplayName("DELETE returns 404 when the customer does not exist")
    void deleteCustomerNotFound() throws Exception {
        doThrow(new CustomerNotFoundException("Customer not found with id: ghost")).when(service)
                .deleteCustomer("ghost");

        mockMvc.perform(delete(BASE + "/ghost"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.path").value(BASE + "/ghost"));
    }

    @Test
    @DisplayName("unexpected failures are translated to a generic 500 without internal details")
    void unexpectedFailureIsGeneric500() throws Exception {
        when(service.getCustomerById("1")).thenThrow(new IllegalStateException("mongo password leaked"));

        mockMvc.perform(get(BASE + "/1"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.errors.error").value("An unexpected error occurred"))
                .andExpect(result -> org.assertj.core.api.Assertions
                        .assertThat(result.getResponse().getContentAsString()).doesNotContain("leaked"));
    }
}
