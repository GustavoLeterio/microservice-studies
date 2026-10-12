package com.gustavoleterio.microservices.product_microservice.category;

import java.util.List;

import org.springframework.stereotype.Service;

import com.gustavoleterio.microservices.product_microservice.exceptions.CategoryAlreadyExistsException;
import com.gustavoleterio.microservices.product_microservice.exceptions.CategoryNotFoundException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j 
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository repository;
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
        return repository.save(mapper.toCategory(request, id)).getId();
    }

    public void deleteCategory(Integer id) {
        repository.findById(id).orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id));
        repository.deleteById(id);
    }
}
