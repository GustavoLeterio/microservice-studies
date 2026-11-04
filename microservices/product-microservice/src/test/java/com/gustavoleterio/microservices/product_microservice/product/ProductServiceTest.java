package com.gustavoleterio.microservices.product_microservice.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.gustavoleterio.microservices.product_microservice.category.Category;
import com.gustavoleterio.microservices.product_microservice.category.CategoryResponse;
import com.gustavoleterio.microservices.product_microservice.category.CategoryService;
import com.gustavoleterio.microservices.product_microservice.exceptions.CategoryNotFoundException;
import com.gustavoleterio.microservices.product_microservice.exceptions.ProductNotFoundException;

class ProductServiceTest {

    private ProductRepository repository;
    private CategoryService categoryService;
    private ProductService service;

    @BeforeEach
    void setUp() {
        repository = mock(ProductRepository.class);
        categoryService = mock(CategoryService.class);
        service = new ProductService(repository, new ProductMapper(), categoryService);
    }

    private static Category category() {
        return Category.builder().id(1).name("Books").description("All books").build();
    }

    private static Product product(int id) {
        return Product.builder().id(id).name("Product " + id).description("desc").price(10.5).stock(3)
                .imageUrl("http://img").category(category()).build();
    }

    private static ProductRequest request(Integer categoryId) {
        return new ProductRequest("New product", "desc", 25.0, 7, "http://img", categoryId);
    }

    private void categoryExists(int id) {
        when(categoryService.getCategoryById(id)).thenReturn(new CategoryResponse(id, "Books", "All books", List.of()));
    }

    private void categoryMissing(int id) {
        when(categoryService.getCategoryById(id)).thenThrow(new CategoryNotFoundException("Category not found with id: " + id));
    }

    // ---------- reads ----------

    // PRD-SVC-01
    @Test
    @DisplayName("getProductById maps the product and its category")
    void getProductById() {
        when(repository.findById(1)).thenReturn(Optional.of(product(1)));

        ProductResponse response = service.getProductById(1);

        assertThat(response.id()).isEqualTo(1);
        assertThat(response.name()).isEqualTo("Product 1");
        assertThat(response.price()).isEqualTo(10.5);
        assertThat(response.stock()).isEqualTo(3);
        assertThat(response.categoryId()).isEqualTo(1);
        assertThat(response.categoryName()).isEqualTo("Books");
    }

    @Test
    @DisplayName("getProductById fails with a message containing the id when the product does not exist")
    void getProductByIdNotFound() {
        when(repository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getProductById(99))
                .isInstanceOf(ProductNotFoundException.class)
                .hasMessage("Product not found with id: 99");
    }

    @Test
    @DisplayName("getAllProducts maps every product")
    void getAllProducts() {
        when(repository.findAll()).thenReturn(List.of(product(1), product(2)));

        assertThat(service.getAllProducts()).extracting(ProductResponse::id).containsExactly(1, 2);
    }

    // PRD-SVC-02
    @Test
    @DisplayName("getProductsByCategoryId returns an empty list (not 404) for an existing category without products")
    void getProductsByCategoryWithoutProducts() {
        categoryExists(1);
        when(repository.findByCategoryId(1)).thenReturn(List.of());

        assertThat(service.getProductsByCategoryId(1)).isEmpty();
    }

    @Test
    @DisplayName("getProductsByCategoryId returns the products of the category")
    void getProductsByCategory() {
        categoryExists(1);
        when(repository.findByCategoryId(1)).thenReturn(List.of(product(1), product(2)));

        assertThat(service.getProductsByCategoryId(1)).extracting(ProductResponse::id).containsExactly(1, 2);
    }

    @Test
    @DisplayName("getProductsByCategoryId fails for an unknown category without querying products")
    void getProductsByUnknownCategory() {
        categoryMissing(5);

        assertThatThrownBy(() -> service.getProductsByCategoryId(5)).isInstanceOf(CategoryNotFoundException.class);
        verifyNoInteractions(repository);
    }

    // ---------- create ----------

    @Test
    @DisplayName("createProduct validates the category, persists the mapped product and returns its id")
    void createProduct() {
        categoryExists(1);
        when(repository.save(any(Product.class))).thenAnswer(inv -> {
            Product saved = inv.getArgument(0);
            saved.setId(42);
            return saved;
        });

        Integer id = service.createProduct(request(1));

        assertThat(id).isEqualTo(42);
        verify(categoryService).getCategoryById(1);
        ArgumentCaptor<Product> captor = ArgumentCaptor.forClass(Product.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue()).satisfies(p -> {
            assertThat(p.getName()).isEqualTo("New product");
            assertThat(p.getPrice()).isEqualTo(25.0);
            assertThat(p.getStock()).isEqualTo(7);
            assertThat(p.getCategory().getId()).isEqualTo(1);
        });
    }

    @Test
    @DisplayName("createProduct with an unknown category fails and never saves")
    void createProductUnknownCategory() {
        categoryMissing(9);

        assertThatThrownBy(() -> service.createProduct(request(9))).isInstanceOf(CategoryNotFoundException.class);
        verify(repository, never()).save(any());
    }

    // ---------- update ----------

    @Test
    @DisplayName("updateProduct saves the new data under the path id")
    void updateProduct() {
        when(repository.findById(5)).thenReturn(Optional.of(product(5)));
        categoryExists(1);
        when(repository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        Integer id = service.updateProduct(5, request(1));

        assertThat(id).isEqualTo(5);
        ArgumentCaptor<Product> captor = ArgumentCaptor.forClass(Product.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo(5);
        assertThat(captor.getValue().getName()).isEqualTo("New product");
    }

    @Test
    @DisplayName("updateProduct on an unknown product fails before checking the category and never saves")
    void updateProductNotFound() {
        when(repository.findById(5)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateProduct(5, request(1))).isInstanceOf(ProductNotFoundException.class);
        verifyNoInteractions(categoryService);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("updateProduct moving to an unknown category fails and never saves")
    void updateProductUnknownCategory() {
        when(repository.findById(5)).thenReturn(Optional.of(product(5)));
        categoryMissing(9);

        assertThatThrownBy(() -> service.updateProduct(5, request(9))).isInstanceOf(CategoryNotFoundException.class);
        verify(repository, never()).save(any());
    }

    // ---------- delete ----------

    @Test
    @DisplayName("deleteProduct removes an existing product")
    void deleteProduct() {
        when(repository.findById(5)).thenReturn(Optional.of(product(5)));

        service.deleteProduct(5);

        verify(repository).deleteById(5);
    }

    @Test
    @DisplayName("deleteProduct on an unknown product fails and never deletes")
    void deleteProductNotFound() {
        when(repository.findById(5)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteProduct(5)).isInstanceOf(ProductNotFoundException.class);
        verify(repository, never()).deleteById(any());
    }
}
