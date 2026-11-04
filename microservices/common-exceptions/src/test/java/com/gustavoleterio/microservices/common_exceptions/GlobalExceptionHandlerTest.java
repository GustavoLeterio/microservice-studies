package com.gustavoleterio.microservices.common_exceptions;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

/**
 * Tests the contract of the error payload shared by customer/product microservices.
 * A stub controller is used so the advice is exercised through the real Spring MVC pipeline.
 */
class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new StubController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    // COM-HND-01
    @Test
    @DisplayName("Bean Validation failure returns 400 with field->message map and the real request path")
    void invalidPayloadReturns400WithFieldErrors() throws Exception {
        mockMvc.perform(post("/stub/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").value("name is required"))
                .andExpect(jsonPath("$.path").value("/stub/validate"))
                .andExpect(jsonPath("$.timestamp").value(not(emptyOrNullString())));
    }

    // COM-HND-02
    @Test
    @DisplayName("Missing request body is reported as 'Request body is missing'")
    void missingBodyReturns400WithSpecificMessage() throws Exception {
        mockMvc.perform(post("/stub/validate").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.error").value("Request body is missing"))
                .andExpect(jsonPath("$.path").value("/stub/validate"));
    }

    // COM-HND-02 (regression: malformed JSON used to be reported as "missing body")
    @Test
    @DisplayName("Malformed JSON is NOT reported as a missing body")
    void malformedJsonReturns400WithDistinctMessage() throws Exception {
        mockMvc.perform(post("/stub/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.error").value("Request body is malformed or has invalid values"));
    }

    // COM-HND-03
    @Test
    @DisplayName("Unexpected exception returns generic 500 without leaking internal details")
    void unexpectedExceptionReturnsGeneric500() throws Exception {
        mockMvc.perform(get("/stub/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.errors.error").value("An unexpected error occurred"))
                .andExpect(jsonPath("$.path").value("/stub/boom"))
                .andExpect(result -> {
                    String body = result.getResponse().getContentAsString();
                    org.assertj.core.api.Assertions.assertThat(body).doesNotContain("secret-internal-detail");
                });
    }

    // COM-HND-04
    @Test
    @DisplayName("Path in the error payload follows the request, never a hardcoded value")
    void pathReflectsRequestUri() throws Exception {
        mockMvc.perform(get("/stub/boom"))
                .andExpect(jsonPath("$.path").value(containsString("/stub/boom")))
                .andExpect(jsonPath("$.path").value(not("/")));
    }

    // COM-HND-05 (regression: a bad id used to be reported as 500)
    @Test
    @DisplayName("Path variable of the wrong type returns 400, not 500")
    void typeMismatchReturns400() throws Exception {
        mockMvc.perform(get("/stub/items/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.id").value("Invalid value for parameter 'id'"))
                .andExpect(jsonPath("$.path").value("/stub/items/abc"));
    }

    // COM-HND-06 (regression: the catch-all turned every client error into 500)
    @Test
    @DisplayName("Unsupported HTTP method keeps its 405 status")
    void methodNotAllowedKeeps405() throws Exception {
        mockMvc.perform(post("/stub/boom"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.errors.error").exists())
                .andExpect(jsonPath("$.path").value("/stub/boom"));
    }

    @Test
    @DisplayName("Unsupported media type keeps its 415 status")
    void unsupportedMediaTypeKeeps415() throws Exception {
        mockMvc.perform(post("/stub/validate")
                .contentType(MediaType.TEXT_PLAIN)
                .content("name=x"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @RestController
    @RequestMapping("/stub")
    static class StubController {

        @GetMapping("/items/{id}")
        public String item(@PathVariable Integer id) {
            return "item " + id;
        }


        @PostMapping("/validate")
        public String validate(@Valid @RequestBody Payload payload) {
            return "ok";
        }

        @GetMapping("/boom")
        public String boom() {
            throw new IllegalStateException("secret-internal-detail");
        }
    }

    public record Payload(@NotBlank(message = "name is required") String name) {
    }
}
