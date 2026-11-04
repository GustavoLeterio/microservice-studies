package com.gustavoleterio.microservices.customer_microservice.customer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.gustavoleterio.microservices.customer_microservice.exceptions.CustomerNotFoundException;

class CustomerServiceTest {

    private CustomerRepository repository;
    private CustomerService service;

    @BeforeEach
    void setUp() {
        repository = mock(CustomerRepository.class);
        // Real mapper on purpose: the service/mapper integration is part of the behaviour under test
        service = new CustomerService(repository, new CustomerMapper());
    }

    private static CustomerRequest request(String phone) {
        return new CustomerRequest("John", "Doe", "john@doe.com", phone, "Street 1", "Springfield");
    }

    private static Customer stored(String id) {
        return Customer.builder().id(id).firstName("Old").lastName("Name").email("old@mail.com")
                .phone("111").address("Old street").city("Old city").build();
    }

    // CUS-SVC-01
    @Test
    @DisplayName("createCustomer persists the mapped entity and returns the generated id")
    void createCustomer() {
        when(repository.save(any(Customer.class))).thenAnswer(inv -> {
            Customer saved = inv.getArgument(0);
            saved.setId("generated-id");
            return saved;
        });

        String id = service.createCustomer(request("999"));

        assertThat(id).isEqualTo("generated-id");
        ArgumentCaptor<Customer> captor = ArgumentCaptor.forClass(Customer.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue()).satisfies(c -> {
            assertThat(c.getFirstName()).isEqualTo("John");
            assertThat(c.getLastName()).isEqualTo("Doe");
            assertThat(c.getEmail()).isEqualTo("john@doe.com");
            assertThat(c.getPhone()).isEqualTo("999");
        });
    }

    // CUS-SVC-02
    @Test
    @DisplayName("getCustomerById maps the stored customer to the response")
    void getCustomerById() {
        when(repository.findById("1")).thenReturn(Optional.of(stored("1")));

        CustomerResponse response = service.getCustomerById("1");

        assertThat(response.id()).isEqualTo("1");
        assertThat(response.email()).isEqualTo("old@mail.com");
        assertThat(response.city()).isEqualTo("Old city");
    }

    @Test
    @DisplayName("getCustomerById fails with a message containing the id when the customer does not exist")
    void getCustomerByIdNotFound() {
        when(repository.findById("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getCustomerById("ghost"))
                .isInstanceOf(CustomerNotFoundException.class)
                .hasMessage("Customer not found with id: ghost");
    }

    // CUS-SVC-03
    @Test
    @DisplayName("updateCustomer replaces every field and keeps the path id")
    void updateCustomerReplacesAllFieldsKeepingId() {
        when(repository.findById("1")).thenReturn(Optional.of(stored("1")));

        String id = service.updateCustomer(request("999"), "1");

        assertThat(id).isEqualTo("1");
        ArgumentCaptor<Customer> captor = ArgumentCaptor.forClass(Customer.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue()).satisfies(c -> {
            assertThat(c.getId()).isEqualTo("1");
            assertThat(c.getFirstName()).isEqualTo("John");
            assertThat(c.getPhone()).isEqualTo("999");
        });
    }

    @Test
    @DisplayName("updateCustomer is a full replace (PUT): omitted optional fields overwrite stored values with null")
    void updateCustomerWithNullOptionalFieldsOverwritesStoredValues() {
        when(repository.findById("1")).thenReturn(Optional.of(stored("1")));

        service.updateCustomer(new CustomerRequest("John", "Doe", "john@doe.com", null, null, null), "1");

        ArgumentCaptor<Customer> captor = ArgumentCaptor.forClass(Customer.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getPhone()).isNull();
        assertThat(captor.getValue().getAddress()).isNull();
        assertThat(captor.getValue().getCity()).isNull();
    }

    @Test
    @DisplayName("updateCustomer on an unknown id fails and never saves")
    void updateCustomerNotFound() {
        when(repository.findById("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateCustomer(request("1"), "ghost"))
                .isInstanceOf(CustomerNotFoundException.class);
        verify(repository, never()).save(any());
    }

    // CUS-SVC-04
    @Test
    @DisplayName("deleteCustomer removes an existing customer")
    void deleteCustomer() {
        when(repository.findById("1")).thenReturn(Optional.of(stored("1")));

        service.deleteCustomer("1");

        verify(repository).deleteById("1");
    }

    @Test
    @DisplayName("deleteCustomer on an unknown id fails and never deletes")
    void deleteCustomerNotFound() {
        when(repository.findById("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteCustomer("ghost")).isInstanceOf(CustomerNotFoundException.class);
        verify(repository, never()).deleteById(any());
    }

    @Test
    @DisplayName("getAllCustomers maps every stored customer")
    void getAllCustomers() {
        when(repository.findAll()).thenReturn(List.of(stored("1"), stored("2")));

        assertThat(service.getAllCustomers()).extracting(CustomerResponse::id).containsExactly("1", "2");
    }

    @Test
    @DisplayName("getAllCustomers returns an empty list (not an error) when there are no customers")
    void getAllCustomersEmpty() {
        when(repository.findAll()).thenReturn(List.of());

        assertThat(service.getAllCustomers()).isEmpty();
    }
}
