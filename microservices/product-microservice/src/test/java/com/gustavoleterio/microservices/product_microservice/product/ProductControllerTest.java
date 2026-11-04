package com.gustavoleterio.microservices.product_microservice.product;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.gustavoleterio.microservices.product_microservice.exceptions.CategoryNotFoundException;
import com.gustavoleterio.microservices.product_microservice.exceptions.ProductNotFoundException;
import com.gustavoleterio.microservices.product_microservice.exceptions.ServiceExceptionHandler;

class ProductControllerTest {

    private static final String BASE = "/api/v1/products";
    private static final String VALID_BODY = """
            {"name":"Dune","description":"sci-fi","price":9.9,"stock":4,"imageUrl":"http://img","categoryId":1}
            """;

    private ProductService service;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(ProductService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new ProductController(service))
                .setControllerAdvice(new ServiceExceptionHandler())
                .build();
    }

    private static ProductResponse response(int id) {
        return new ProductResponse(id, "Product " + id, "desc", 9.9, 4, "http://img", 1, "Books", "All books");
    }

    // ---------- GET ----------

    // PRD-CTL-01
    @Test
    @DisplayName("GET / returns all products")
    void getAll() throws Exception {
        when(service.getAllProducts()).thenReturn(List.of(response(1), response(2)));

        mockMvc.perform(get(BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].categoryName").value("Books"));
    }

    @Test
    @DisplayName("GET /{id} returns the product")
    void getById() throws Exception {
        when(service.getProductById(1)).thenReturn(response(1));

        mockMvc.perform(get(BASE + "/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.stock").value(4));
    }

    @Test
    @DisplayName("GET /{id} returns 404 with the real path for an unknown product")
    void getByIdNotFound() throws Exception {
        when(service.getProductById(99)).thenThrow(new ProductNotFoundException("Product not found with id: 99"));

        mockMvc.perform(get(BASE + "/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errors.product").value("Product not found with id: 99"))
                .andExpect(jsonPath("$.path").value(BASE + "/99"));
    }

    @Test
    @DisplayName("GET /{id} with a non numeric id is rejected with 4xx, not 500")
    void getByIdWithInvalidIdType() throws Exception {
        mockMvc.perform(get(BASE + "/abc")).andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("GET /category/{id} returns an empty list (200) for a category without products")
    void getByCategoryEmpty() throws Exception {
        when(service.getProductsByCategoryId(1)).thenReturn(List.of());

        mockMvc.perform(get(BASE + "/category/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("GET /category/{id} returns 404 for an unknown category")
    void getByCategoryNotFound() throws Exception {
        when(service.getProductsByCategoryId(5)).thenThrow(new CategoryNotFoundException("Category not found with id: 5"));

        mockMvc.perform(get(BASE + "/category/5"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errors.category").value("Category not found with id: 5"));
    }

    // ---------- POST ----------

    // PRD-CTL-02
    @Test
    @DisplayName("POST creates the product and returns its id")
    void create() throws Exception {
        when(service.createProduct(any(ProductRequest.class))).thenReturn(42);

        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isOk())
                .andExpect(content().string("42"));
    }

    @Test
    @DisplayName("POST accepts the boundary values price = 0 and stock = 0")
    void createAcceptsZeroPriceAndStock() throws Exception {
        when(service.createProduct(any(ProductRequest.class))).thenReturn(1);

        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Free\",\"price\":0,\"stock\":0,\"categoryId\":1}"))
                .andExpect(status().isOk());
    }

    static Stream<Arguments> invalidBodies() {
        return Stream.of(
                Arguments.of("blank name", "name", "{\"name\":\" \",\"price\":1,\"stock\":1,\"categoryId\":1}"),
                Arguments.of("missing name", "name", "{\"price\":1,\"stock\":1,\"categoryId\":1}"),
                Arguments.of("missing price", "price", "{\"name\":\"a\",\"stock\":1,\"categoryId\":1}"),
                Arguments.of("missing stock", "stock", "{\"name\":\"a\",\"price\":1,\"categoryId\":1}"),
                // PRD-CTL-04: regression, the category used to be optional
                Arguments.of("missing categoryId", "categoryId", "{\"name\":\"a\",\"price\":1,\"stock\":1}"),
                // PRD-CTL-05: regression, negative values used to be accepted
                Arguments.of("negative price", "price",
                        "{\"name\":\"a\",\"price\":-1,\"stock\":1,\"categoryId\":1}"),
                Arguments.of("negative stock", "stock",
                        "{\"name\":\"a\",\"price\":1,\"stock\":-5,\"categoryId\":1}"));
    }

    @ParameterizedTest(name = "POST rejects {0}")
    @MethodSource("invalidBodies")
    void createRejectsInvalidBody(String description, String field, String json) throws Exception {
        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors." + field).exists())
                .andExpect(jsonPath("$.path").value(BASE));

        verifyNoInteractions(service);
    }

    @Test
    @DisplayName("POST reports an unknown category as 404")
    void createWithUnknownCategory() throws Exception {
        when(service.createProduct(any(ProductRequest.class)))
                .thenThrow(new CategoryNotFoundException("Category not found with id: 1"));

        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST with malformed JSON returns 400")
    void createWithMalformedJson() throws Exception {
        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content("{\"name\":"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(service);
    }

    // ---------- PUT ----------

    // PRD-CTL-03
    @Test
    @DisplayName("PUT updates the product and returns its id")
    void update() throws Exception {
        when(service.updateProduct(eq(1), any(ProductRequest.class))).thenReturn(1);

        mockMvc.perform(put(BASE + "/1").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isOk())
                .andExpect(content().string("1"));
    }

    @Test
    @DisplayName("PUT returns 404 for an unknown product")
    void updateNotFound() throws Exception {
        when(service.updateProduct(eq(99), any(ProductRequest.class)))
                .thenThrow(new ProductNotFoundException("Product not found with id: 99"));

        mockMvc.perform(put(BASE + "/99").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT with negative stock returns 400 and does not call the service")
    void updateRejectsNegativeStock() throws Exception {
        mockMvc.perform(put(BASE + "/1").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"a\",\"price\":1,\"stock\":-1,\"categoryId\":1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.stock").value("Product stock must not be negative"));

        verifyNoInteractions(service);
    }

    // ---------- DELETE ----------

    @Test
    @DisplayName("DELETE removes the product and answers 200")
    void deleteProduct() throws Exception {
        mockMvc.perform(delete(BASE + "/1")).andExpect(status().isOk());

        verify(service).deleteProduct(1);
    }

    @Test
    @DisplayName("DELETE returns 404 for an unknown product")
    void deleteNotFound() throws Exception {
        doThrow(new ProductNotFoundException("Product not found with id: 99")).when(service).deleteProduct(99);

        mockMvc.perform(delete(BASE + "/99")).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("unexpected failures are translated to a generic 500 without internal details")
    void unexpectedFailureIsGeneric500() throws Exception {
        when(service.getAllProducts()).thenThrow(new IllegalStateException("jdbc:postgresql://secret-host"));

        mockMvc.perform(get(BASE))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.errors.error").value("An unexpected error occurred"))
                .andExpect(result -> org.assertj.core.api.Assertions
                        .assertThat(result.getResponse().getContentAsString()).doesNotContain("secret-host"));
    }
}
