package com.gustavoleterio.microservices.product_microservice.category;

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

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.gustavoleterio.microservices.product_microservice.exceptions.CategoryAlreadyExistsException;
import com.gustavoleterio.microservices.product_microservice.exceptions.CategoryInUseException;
import com.gustavoleterio.microservices.product_microservice.exceptions.CategoryNotFoundException;
import com.gustavoleterio.microservices.product_microservice.exceptions.ServiceExceptionHandler;
import com.gustavoleterio.microservices.product_microservice.product.ProductResponse;

class CategoryControllerTest {

    private static final String BASE = "/api/v1/categories";
    private static final String VALID_BODY = "{\"name\":\"Books\",\"description\":\"All books\"}";

    private CategoryService service;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(CategoryService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new CategoryController(service))
                .setControllerAdvice(new ServiceExceptionHandler())
                .build();
    }

    // ---------- GET ----------

    // CAT-CTL-01
    @Test
    @DisplayName("GET / returns all categories with their products")
    void getAll() throws Exception {
        ProductResponse product = new ProductResponse(10, "Dune", "d", 9.9, 2, null, 1, "Books", "All books");
        when(service.getAllCategories()).thenReturn(List.of(new CategoryResponse(1, "Books", "All books", List.of(product))));

        mockMvc.perform(get(BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Books"))
                .andExpect(jsonPath("$[0].products[0].name").value("Dune"));
    }

    @Test
    @DisplayName("GET /{id} returns the category")
    void getById() throws Exception {
        when(service.getCategoryById(1)).thenReturn(new CategoryResponse(1, "Books", "All books", List.of()));

        mockMvc.perform(get(BASE + "/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("GET /{id} returns 404 with the real path for an unknown category")
    void getByIdNotFound() throws Exception {
        when(service.getCategoryById(99)).thenThrow(new CategoryNotFoundException("Category not found with id: 99"));

        mockMvc.perform(get(BASE + "/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errors.category").value("Category not found with id: 99"))
                .andExpect(jsonPath("$.path").value(BASE + "/99"));
    }

    // ---------- POST ----------

    @Test
    @DisplayName("POST creates the category and returns its id")
    void create() throws Exception {
        when(service.createCategory(any(CategoryRequest.class))).thenReturn(7);

        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isOk())
                .andExpect(content().string("7"));
    }

    // CAT-CTL-02
    @Test
    @DisplayName("POST with an existing name returns 409")
    void createDuplicate() throws Exception {
        when(service.createCategory(any(CategoryRequest.class)))
                .thenThrow(new CategoryAlreadyExistsException("Category with name Books already exists"));

        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors.category").value("Category with name Books already exists"))
                .andExpect(jsonPath("$.path").value(BASE));
    }

    // CAT-CTL-03 (regression: CategoryRequest had no constraints, so @Valid did nothing)
    @ParameterizedTest(name = "POST rejects body {0}")
    @ValueSource(strings = { "{\"description\":\"no name\"}", "{\"name\":\"\"}", "{\"name\":\"   \"}", "{\"name\":null}" })
    void createRejectsBlankName(String json) throws Exception {
        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").value("Category name is required"));

        verifyNoInteractions(service);
    }

    @Test
    @DisplayName("POST racing with another request on the same name (DB unique violation) returns 409, not 500")
    void createRaceConditionIs409() throws Exception {
        when(service.createCategory(any(CategoryRequest.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key value violates unique constraint"));

        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isConflict())
                .andExpect(result -> org.assertj.core.api.Assertions
                        .assertThat(result.getResponse().getContentAsString()).doesNotContain("duplicate key"));
    }

    // ---------- PUT ----------

    // CAT-CTL-04
    @Test
    @DisplayName("PUT updates the category and returns its id")
    void update() throws Exception {
        when(service.updateCategory(eq(1), any(CategoryRequest.class))).thenReturn(1);

        mockMvc.perform(put(BASE + "/1").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isOk())
                .andExpect(content().string("1"));
    }

    @Test
    @DisplayName("PUT renaming to the name of another category returns 409 (was a database failure/500)")
    void updateToExistingNameIs409() throws Exception {
        when(service.updateCategory(eq(1), any(CategoryRequest.class)))
                .thenThrow(new CategoryAlreadyExistsException("Category with name Books already exists"));

        mockMvc.perform(put(BASE + "/1").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("PUT returns 404 for an unknown category")
    void updateNotFound() throws Exception {
        when(service.updateCategory(eq(99), any(CategoryRequest.class)))
                .thenThrow(new CategoryNotFoundException("Category not found with id: 99"));

        mockMvc.perform(put(BASE + "/99").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT with a blank name returns 400 and does not call the service")
    void updateRejectsBlankName() throws Exception {
        mockMvc.perform(put(BASE + "/1").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\" \"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(service);
    }

    // ---------- DELETE ----------

    @Test
    @DisplayName("DELETE removes the category and answers 200")
    void deleteCategory() throws Exception {
        mockMvc.perform(delete(BASE + "/1")).andExpect(status().isOk());

        verify(service).deleteCategory(1);
    }

    @Test
    @DisplayName("DELETE returns 404 for an unknown category")
    void deleteNotFound() throws Exception {
        doThrow(new CategoryNotFoundException("Category not found with id: 99")).when(service).deleteCategory(99);

        mockMvc.perform(delete(BASE + "/99")).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE of a category that still has products returns 409 with a business message")
    void deleteCategoryInUseIs409() throws Exception {
        doThrow(new CategoryInUseException("Category with id 1 cannot be deleted because it has products"))
                .when(service).deleteCategory(1);

        mockMvc.perform(delete(BASE + "/1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors.category").value("Category with id 1 cannot be deleted because it has products"));
    }

    @Test
    @DisplayName("DELETE hitting a foreign key violation in the database returns 409, not 500")
    void deleteForeignKeyViolationIs409() throws Exception {
        doThrow(new DataIntegrityViolationException("violates foreign key constraint")).when(service).deleteCategory(1);

        mockMvc.perform(delete(BASE + "/1")).andExpect(status().isConflict());
    }
}
