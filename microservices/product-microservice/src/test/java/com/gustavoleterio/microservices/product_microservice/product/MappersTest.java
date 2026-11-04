package com.gustavoleterio.microservices.product_microservice.product;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.gustavoleterio.microservices.product_microservice.category.Category;
import com.gustavoleterio.microservices.product_microservice.category.CategoryMapper;
import com.gustavoleterio.microservices.product_microservice.category.CategoryRequest;
import com.gustavoleterio.microservices.product_microservice.category.CategoryResponse;

class MappersTest {

    private final ProductMapper productMapper = new ProductMapper();
    private final CategoryMapper categoryMapper = new CategoryMapper(productMapper);

    // PRD-MAP-01
    @Test
    @DisplayName("toProduct links the category by id and keeps the given product id")
    void toProduct() {
        Product product = productMapper.toProduct(new ProductRequest("Dune", "sci-fi", 9.9, 4, "http://img", 3), 8);

        assertThat(product.getId()).isEqualTo(8);
        assertThat(product.getName()).isEqualTo("Dune");
        assertThat(product.getPrice()).isEqualTo(9.9);
        assertThat(product.getStock()).isEqualTo(4);
        assertThat(product.getCategory().getId()).isEqualTo(3);
    }

    @Test
    @DisplayName("toProduct without id leaves the id empty for the database to generate")
    void toProductWithoutId() {
        Product product = productMapper.toProduct(new ProductRequest("Dune", null, 9.9, 4, null, 3));

        assertThat(product.getId()).isNull();
    }

    @Test
    @DisplayName("toProductResponse flattens the category data")
    void toProductResponse() {
        Category category = Category.builder().id(3).name("Books").description("All books").build();
        Product product = Product.builder().id(8).name("Dune").description("sci-fi").price(9.9).stock(4)
                .imageUrl("http://img").category(category).build();

        ProductResponse response = productMapper.toProductResponse(product);

        assertThat(response).isEqualTo(new ProductResponse(8, "Dune", "sci-fi", 9.9, 4, "http://img", 3, "Books",
                "All books"));
    }

    @Test
    @DisplayName("toProductResponse does not throw NPE for a product without category")
    void toProductResponseWithoutCategory() {
        Product product = Product.builder().id(8).name("Dune").price(9.9).stock(4).build();

        ProductResponse response = productMapper.toProductResponse(product);

        assertThat(response.categoryId()).isNull();
        assertThat(response.categoryName()).isNull();
    }

    // CAT-MAP-01
    @Test
    @DisplayName("toCategoryResponse does not throw NPE when the category has no products list")
    void toCategoryResponseWithNullProducts() {
        Category category = Category.builder().id(1).name("Books").description("d").build();

        CategoryResponse response = categoryMapper.toCategoryResponse(category);

        assertThat(response.products()).isNotNull().isEmpty();
    }

    @Test
    @DisplayName("toCategoryResponse maps nested products")
    void toCategoryResponseWithProducts() {
        Category category = Category.builder().id(1).name("Books").description("d").build();
        category.setProducts(List.of(Product.builder().id(5).name("Dune").price(1.0).stock(1).category(category).build()));

        CategoryResponse response = categoryMapper.toCategoryResponse(category);

        assertThat(response.products()).singleElement().extracting(ProductResponse::name).isEqualTo("Dune");
    }

    @Test
    @DisplayName("toCategory keeps the given id and copies name/description")
    void toCategory() {
        Category category = categoryMapper.toCategory(new CategoryRequest("Books", "All books"), 4);

        assertThat(category.getId()).isEqualTo(4);
        assertThat(category.getName()).isEqualTo("Books");
        assertThat(category.getDescription()).isEqualTo("All books");
    }
}
