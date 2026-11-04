package com.gustavoleterio.microservices.product_microservice.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record ProductRequest (
    @NotBlank (message = "Product name is required")
    String name,
    String description,
    @NotNull (message = "Product price is required")
    @PositiveOrZero (message = "Product price must not be negative")
    Double price,
    @NotNull (message = "Product stock is required")
    @PositiveOrZero (message = "Product stock must not be negative")
    Integer stock,
    String imageUrl,
    @NotNull (message = "Product category is required")
    Integer categoryId
) {}
