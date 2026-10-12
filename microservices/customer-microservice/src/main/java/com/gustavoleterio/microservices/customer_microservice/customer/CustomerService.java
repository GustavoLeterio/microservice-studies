package com.gustavoleterio.microservices.customer_microservice.customer;

import lombok.RequiredArgsConstructor;

import java.util.List;
import org.springframework.stereotype.Service;

import com.gustavoleterio.microservices.customer_microservice.exceptions.CustomerNotFoundException;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository repository;
    private final CustomerMapper mapper;

    public String createCustomer(CustomerRequest customer) {
        Customer entity = repository.save(mapper.toCustomer(customer));
        return entity.getId();
    }

    public String updateCustomer(CustomerRequest customer, String customerId) {
        repository.findById(customerId).orElseThrow(() -> new CustomerNotFoundException("Customer not found with id: " + customerId));
        Customer entity = mapper.toCustomer(customer);
        entity.setId(customerId);
        repository.save(entity);
        return customerId;
    }



    public CustomerResponse getCustomerById(String customerId) {
        return repository.findById(customerId)
                .map(mapper::toCustomerResponse)
                .orElseThrow(() -> new CustomerNotFoundException("Customer not found with id: " + customerId));
    }

    public List<CustomerResponse> getAllCustomers() {
        return repository
                .findAll().stream()
                .map(mapper::toCustomerResponse)
                .toList();
    }

    public void deleteCustomer(String customerId) {
        repository.findById(customerId).orElseThrow(() -> new CustomerNotFoundException("Customer not found with id: " + customerId));
        repository.deleteById(customerId);
    }

}
