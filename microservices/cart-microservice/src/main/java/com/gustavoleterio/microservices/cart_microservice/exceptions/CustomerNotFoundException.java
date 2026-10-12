package com.gustavoleterio.microservices.cart_microservice.exceptions;

public class CustomerNotFoundException extends RuntimeException {
    public CustomerNotFoundException(String customerId) {
        super("Customer not found with id: " + customerId);
    }
}
