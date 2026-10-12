package com.gustavoleterio.microservices.product_microservice.product;


public record ProductResponse (
    Integer id,
    String name,
    String description,
    double price,
    Integer stock,
    String imageUrl,
    Integer categoryId,
    String categoryName,
    String categoryDescription
) {}