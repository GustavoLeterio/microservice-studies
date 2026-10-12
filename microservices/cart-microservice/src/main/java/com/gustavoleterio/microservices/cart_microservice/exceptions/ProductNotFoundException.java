package com.gustavoleterio.microservices.cart_microservice.exceptions;

public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(Integer productId) {
        super("Product not found with id: " + productId);
    }
}
