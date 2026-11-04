package com.gustavoleterio.microservices.product_microservice.category;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.gustavoleterio.microservices.product_microservice.exceptions.CategoryAlreadyExistsException;
import com.gustavoleterio.microservices.product_microservice.exceptions.CategoryInUseException;
import com.gustavoleterio.microservices.product_microservice.exceptions.CategoryNotFoundException;
import com.gustavoleterio.microservices.product_microservice.product.Product;
import com.gustavoleterio.microservices.product_microservice.product.ProductMapper;
import com.gustavoleterio.microservices.product_microservice.product.ProductRepository;

class CategoryServiceTest {

    private CategoryRepository repository;
    private ProductRepository productRepository;
    private CategoryService service;

    @BeforeEach
    void setUp() {
        repository = mock(CategoryRepository.class);
        productRepository = mock(ProductRepository.class);
        service = new CategoryService(repository, productRepository, new CategoryMapper(new ProductMapper()));
    }

    private static Category category(int id, String name) {
        return Category.builder().id(id).name(name).description("desc of " + name).products(List.of()).build();
    }

    // ---------- create ----------

    // CAT-SVC-01
    @Test
    @DisplayName("createCategory persists the mapped category and returns its id")
    void createCategory() {
        when(repository.findByName("Books")).thenReturn(Optional.empty());
        when(repository.save(any(Category.class))).thenAnswer(inv -> {
            Category saved = inv.getArgument(0);
            saved.setId(7);
            return saved;
        });

        Integer id = service.createCategory(new CategoryRequest("Books", "All books"));

        assertThat(id).isEqualTo(7);
        ArgumentCaptor<Category> captor = ArgumentCaptor.forClass(Category.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Books");
        assertThat(captor.getValue().getDescription()).isEqualTo("All books");
    }

    @Test
    @DisplayName("createCategory with an existing name fails with 'already exists' and never saves")
    void createCategoryDuplicateName() {
        when(repository.findByName("Books")).thenReturn(Optional.of(category(1, "Books")));

        assertThatThrownBy(() -> service.createCategory(new CategoryRequest("Books", "x")))
                .isInstanceOf(CategoryAlreadyExistsException.class)
                .hasMessageContaining("Books");
        verify(repository, never()).save(any());
    }

    // ---------- read ----------

    // CAT-SVC-02
    @Test
    @DisplayName("getCategoryById maps the category")
    void getCategoryById() {
        when(repository.findById(1)).thenReturn(Optional.of(category(1, "Books")));

        CategoryResponse response = service.getCategoryById(1);

        assertThat(response.id()).isEqualTo(1);
        assertThat(response.name()).isEqualTo("Books");
        assertThat(response.products()).isEmpty();
    }

    @Test
    @DisplayName("getCategoryById on an unknown id fails with a message containing the id")
    void getCategoryByIdNotFound() {
        when(repository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getCategoryById(99))
                .isInstanceOf(CategoryNotFoundException.class)
                .hasMessage("Category not found with id: 99");
    }

    @Test
    @DisplayName("getAllCategories maps every category")
    void getAllCategories() {
        when(repository.findAll()).thenReturn(List.of(category(1, "Books"), category(2, "Toys")));

        assertThat(service.getAllCategories()).extracting(CategoryResponse::name).containsExactly("Books", "Toys");
    }

    // ---------- update ----------

    // CAT-SVC-03
    @Test
    @DisplayName("updateCategory saves the new data under the path id")
    void updateCategory() {
        when(repository.findById(1)).thenReturn(Optional.of(category(1, "Books")));
        when(repository.findByName("Novels")).thenReturn(Optional.empty());
        when(repository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        Integer id = service.updateCategory(1, new CategoryRequest("Novels", "Fiction"));

        assertThat(id).isEqualTo(1);
        ArgumentCaptor<Category> captor = ArgumentCaptor.forClass(Category.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo(1);
        assertThat(captor.getValue().getName()).isEqualTo("Novels");
    }

    @Test
    @DisplayName("updateCategory on an unknown id fails and never saves")
    void updateCategoryNotFound() {
        when(repository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateCategory(99, new CategoryRequest("X", "y")))
                .isInstanceOf(CategoryNotFoundException.class);
        verify(repository, never()).save(any());
    }

    // CAT-SVC-04
    @Test
    @DisplayName("updateCategory renaming to the name of ANOTHER category fails with 409 semantics and never saves")
    void updateCategoryToNameOfAnotherCategory() {
        when(repository.findById(1)).thenReturn(Optional.of(category(1, "Books")));
        when(repository.findByName("Toys")).thenReturn(Optional.of(category(2, "Toys")));

        assertThatThrownBy(() -> service.updateCategory(1, new CategoryRequest("Toys", "x")))
                .isInstanceOf(CategoryAlreadyExistsException.class)
                .hasMessageContaining("Toys");
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("updateCategory keeping its own name (only description changes) is allowed")
    void updateCategoryKeepingOwnName() {
        Category current = category(1, "Books");
        when(repository.findById(1)).thenReturn(Optional.of(current));
        when(repository.findByName("Books")).thenReturn(Optional.of(current));
        when(repository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

        Integer id = service.updateCategory(1, new CategoryRequest("Books", "New description"));

        assertThat(id).isEqualTo(1);
        verify(repository).save(any(Category.class));
    }

    // ---------- delete ----------

    @Test
    @DisplayName("deleteCategory removes a category without products")
    void deleteCategory() {
        when(repository.findById(1)).thenReturn(Optional.of(category(1, "Books")));
        when(productRepository.existsByCategoryId(1)).thenReturn(false);

        service.deleteCategory(1);

        verify(repository).deleteById(1);
    }

    @Test
    @DisplayName("deleteCategory on an unknown id fails and never deletes")
    void deleteCategoryNotFound() {
        when(repository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteCategory(99)).isInstanceOf(CategoryNotFoundException.class);
        verify(repository, never()).deleteById(any());
    }

    // CAT-SVC-05
    @Test
    @DisplayName("deleteCategory with products attached fails with a business error instead of a database failure")
    void deleteCategoryWithProducts() {
        when(repository.findById(1)).thenReturn(Optional.of(category(1, "Books")));
        when(productRepository.existsByCategoryId(1)).thenReturn(true);

        assertThatThrownBy(() -> service.deleteCategory(1))
                .isInstanceOf(CategoryInUseException.class)
                .hasMessageContaining("1")
                .hasMessageContaining("products");
        verify(repository, never()).deleteById(any());
    }

    @Test
    @DisplayName("getCategoryById includes the products of the category in the response")
    void getCategoryByIdIncludesProducts() {
        Category books = category(1, "Books");
        books.setProducts(List.of(Product.builder().id(10).name("Dune").price(9.9).stock(2).category(books).build()));
        when(repository.findById(1)).thenReturn(Optional.of(books));

        CategoryResponse response = service.getCategoryById(1);

        assertThat(response.products()).singleElement().satisfies(p -> {
            assertThat(p.id()).isEqualTo(10);
            assertThat(p.categoryName()).isEqualTo("Books");
        });
    }
}
