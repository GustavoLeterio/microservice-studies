package com.gustavoleterio.microservices.product_microservice.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ProductRequest (
    @NotBlank (message = "Product name is required")
    String name,
    String description,
    @NotNull (message = "Product price is required")
    Double price,
    @NotNull (message = "Product stock is required")
    Integer stock,
    String imageUrl,
    Integer categoryId
) {}
