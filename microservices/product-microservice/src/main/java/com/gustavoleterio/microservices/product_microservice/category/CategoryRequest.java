package com.gustavoleterio.microservices.product_microservice.category;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest (
    @NotBlank (message = "Category name is required")
    String name,
    String description
) {

}
