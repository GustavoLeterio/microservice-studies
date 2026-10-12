package com.gustavoleterio.microservices.product_microservice.exceptions;

import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode (callSuper = true)
@Data
public class ProductNotFoundException extends RuntimeException {
    private final String message;
}
