package com.gustavoleterio.microservices.product_microservice.product;

import org.springframework.stereotype.Service;

import com.gustavoleterio.microservices.product_microservice.category.Category;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductMapper {
    public ProductResponse toProductResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getImageUrl(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getCategory().getDescription());
    }

    public Product toProduct(ProductRequest productRequest) {
        return toProduct(productRequest, null);
    }

    public Product toProduct(ProductRequest productRequest, Integer id) {
        return new Product(
                id,
                productRequest.name(),
                productRequest.description(),
                productRequest.price(),
                productRequest.stock(),
                productRequest.imageUrl(),
                Category.builder().id(productRequest.categoryId()).build());
    }
}
