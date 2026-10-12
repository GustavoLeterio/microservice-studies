package com.gustavoleterio.microservices.product_microservice.product;

import java.util.List;

import org.springframework.stereotype.Service;

import com.gustavoleterio.microservices.product_microservice.category.CategoryService;
import com.gustavoleterio.microservices.product_microservice.exceptions.ProductNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository repository;
    private final ProductMapper mapper;
    private final CategoryService categoryService;

    public ProductResponse getProductById(Integer id) {
        return repository.findById(id)
            .map(mapper::toProductResponse)
            .orElseThrow(() -> new ProductNotFoundException("Product not found with id: " + id));
    }
    
    public List<ProductResponse> getProductsByCategoryId(Integer categoryId) {
        categoryService.getCategoryById(categoryId); // Check if the category exists
        return repository.findByCategoryId(categoryId).orElseThrow(() -> new ProductNotFoundException("Products not found with category id: " + categoryId)).stream()
            .map(mapper::toProductResponse)
            .toList();
    }

    public List<ProductResponse> getAllProducts() {
        return repository.findAll().stream()
            .map(mapper::toProductResponse)
            .toList();
    }
    
    public Integer createProduct(ProductRequest productRequest) {
        categoryService.getCategoryById(productRequest.categoryId()); // Check if the category exists
        return repository.save(mapper.toProduct(productRequest)).getId();
    }
    
    public Integer updateProduct(Integer id, ProductRequest productRequest) {
        repository.findById(id).orElseThrow(() -> new ProductNotFoundException("Product not found with id: " + id));
        categoryService.getCategoryById(productRequest.categoryId()); // Check if the category exists
        return repository.save(mapper.toProduct(productRequest, id)).getId();
    }
    
    public void deleteProduct(Integer id) {
        repository.findById(id).orElseThrow(() -> new ProductNotFoundException("Product not found with id: " + id));
        repository.deleteById(id);
    }
}
