package com.gustavoleterio.microservices.cart_microservice.customer;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Optional;

@FeignClient(name = "CUSTOMER-MICROSERVICE")
public interface CustomerClient {

    @GetMapping("/api/v1/customers/{id}")
    Optional<CustomerResponse> getCustomerById(@PathVariable("id") String customerId);
}
