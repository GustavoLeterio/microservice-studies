package com.gustavoleterio.microservices.product_microservice.category;

import org.springframework.stereotype.Service;
import com.gustavoleterio.microservices.product_microservice.product.ProductMapper;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CategoryMapper {
    private final ProductMapper productMapper;

    public Category toCategory(CategoryRequest categoryRequest, Integer id) {
        return Category.builder()
                .id(id)
                .name(categoryRequest.name())
                .description(categoryRequest.description())
                .build();
    }

    public Category toCategory(CategoryRequest categoryRequest) {
        return toCategory(categoryRequest, null);
    }

    public CategoryResponse toCategoryResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getProducts().stream()
                        .map(productMapper::toProductResponse)
                        .toList());
    }
}
