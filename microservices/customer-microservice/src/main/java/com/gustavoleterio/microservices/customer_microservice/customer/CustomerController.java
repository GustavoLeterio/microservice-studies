package com.gustavoleterio.microservices.customer_microservice.customer;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;



@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor 
public class CustomerController {

    private final CustomerService service;

    @GetMapping("/{customerId}")
    public ResponseEntity<CustomerResponse> getCustomerById(@PathVariable String customerId) {
        return ResponseEntity.ok(service.getCustomerById(customerId));
    }
    @GetMapping("/all")
    public ResponseEntity<List<CustomerResponse>> getAllCustomers() {
        return ResponseEntity.ok(service.getAllCustomers());
    }

    @PostMapping()
    public ResponseEntity<String> createCustomer(@Valid @RequestBody CustomerRequest entity) {
        return ResponseEntity.ok(service.createCustomer(entity));
    }

    @PutMapping("/{customerId}")
    public ResponseEntity<Void> updateCustomer(@Valid @RequestBody CustomerRequest entity, 
         @PathVariable String customerId) {
        ResponseEntity.ok(service.updateCustomer(entity, customerId));
        return ResponseEntity.accepted().build();
    }

    @DeleteMapping("/{customerId}") 
    public ResponseEntity<Void> deleteCustomer( @Valid @PathVariable String customerId) {
        service.deleteCustomer(customerId);
        return ResponseEntity.accepted().build();
    }
}