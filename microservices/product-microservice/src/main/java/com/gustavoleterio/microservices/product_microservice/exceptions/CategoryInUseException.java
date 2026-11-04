package com.gustavoleterio.microservices.product_microservice.exceptions;

/**
 * Thrown when a category cannot be removed because products still reference it.
 */
public class CategoryInUseException extends RuntimeException {
    public CategoryInUseException(String message) {
        super(message);
    }
}
