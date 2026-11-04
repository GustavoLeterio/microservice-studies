package com.gustavoleterio.microservices.product_microservice.category;

import java.util.List;

import org.springframework.stereotype.Service;

import com.gustavoleterio.microservices.product_microservice.exceptions.CategoryAlreadyExistsException;
import com.gustavoleterio.microservices.product_microservice.exceptions.CategoryInUseException;
import com.gustavoleterio.microservices.product_microservice.exceptions.CategoryNotFoundException;
import com.gustavoleterio.microservices.product_microservice.product.ProductRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j 
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository repository;
    private final ProductRepository productRepository;
    private final CategoryMapper mapper;

    public CategoryResponse getCategoryById(Integer id) {
        return mapper.toCategoryResponse(repository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id)));
    }

    public List<CategoryResponse> getAllCategories() {
        return repository.findAll().stream()
                .map(mapper::toCategoryResponse)
                .toList();
    }

    public Integer createCategory(CategoryRequest request) {
        repository.findByName(request.name()).ifPresent(category -> {
            throw new CategoryAlreadyExistsException("Category with name " + request.name() + " already exists");
        });
        return repository.save(mapper.toCategory(request)).getId();
    }

    public Integer updateCategory(Integer id, CategoryRequest request) {
        repository.findById(id).orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id));
        // The name is unique: renaming to the name of ANOTHER category must be rejected
        repository.findByName(request.name())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new CategoryAlreadyExistsException("Category with name " + request.name() + " already exists");
                });
        return repository.save(mapper.toCategory(request, id)).getId();
    }

    public void deleteCategory(Integer id) {
        repository.findById(id).orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id));
        if (productRepository.existsByCategoryId(id)) {
            throw new CategoryInUseException("Category with id " + id + " cannot be deleted because it has products");
        }
        repository.deleteById(id);
    }
}
