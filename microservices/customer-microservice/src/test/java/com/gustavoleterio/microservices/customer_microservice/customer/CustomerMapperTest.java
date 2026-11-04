package com.gustavoleterio.microservices.customer_microservice.customer;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CustomerMapperTest {

    private final CustomerMapper mapper = new CustomerMapper();

    // CUS-MAP-01
    @Test
    @DisplayName("toCustomer copies every request field and leaves the id empty for the database to generate")
    void toCustomer() {
        Customer customer = mapper.toCustomer(
                new CustomerRequest("John", "Doe", "john@doe.com", "123", "Street 1", "Springfield"));

        assertThat(customer.getId()).isNull();
        assertThat(customer.getFirstName()).isEqualTo("John");
        assertThat(customer.getLastName()).isEqualTo("Doe");
        assertThat(customer.getEmail()).isEqualTo("john@doe.com");
        assertThat(customer.getPhone()).isEqualTo("123");
        assertThat(customer.getAddress()).isEqualTo("Street 1");
        assertThat(customer.getCity()).isEqualTo("Springfield");
    }

    @Test
    @DisplayName("toCustomerResponse copies every entity field including the id")
    void toCustomerResponse() {
        Customer customer = Customer.builder().id("1").firstName("John").lastName("Doe").email("john@doe.com")
                .phone("123").address("Street 1").city("Springfield").build();

        CustomerResponse response = mapper.toCustomerResponse(customer);

        assertThat(response).isEqualTo(new CustomerResponse("1", "John", "Doe", "john@doe.com", "123", "Street 1",
                "Springfield"));
    }

    @Test
    @DisplayName("optional fields stay null through the mapping")
    void optionalFieldsStayNull() {
        Customer customer = mapper.toCustomer(new CustomerRequest("John", "Doe", "john@doe.com", null, null, null));

        assertThat(customer.getPhone()).isNull();
        assertThat(customer.getAddress()).isNull();
        assertThat(customer.getCity()).isNull();
    }
}
