package com.gustavoleterio.microservices.cart_microservice.cart;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.gustavoleterio.microservices.cart_microservice.exceptions.CartException;
import com.gustavoleterio.microservices.cart_microservice.exceptions.CartExceptionHandler;
import com.gustavoleterio.microservices.cart_microservice.exceptions.CustomerNotFoundException;
import com.gustavoleterio.microservices.cart_microservice.exceptions.ProductNotFoundException;
import com.gustavoleterio.microservices.cart_microservice.item.Item;

import feign.FeignException;
import feign.Request;
import feign.RetryableException;

/**
 * HTTP contract of the cart endpoints, including how failures (domain and downstream)
 * are translated by {@link CartExceptionHandler}.
 */
class CartControllerTest {

    private static final String BASE = "/api/v1/carts/customer-1";

    private CartService service;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(CartService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new CartController(service))
                .setControllerAdvice(new CartExceptionHandler())
                .build();
    }

    private static Cart cartWith(Item... items) {
        return new Cart("customer-1", new ArrayList<>(List.of(items)));
    }

    // ---------- happy paths ----------

    // CART-CTL-01
    @Test
    @DisplayName("GET /carts/{customerId} returns the cart")
    void getCart() throws Exception {
        when(service.getOrCreateCart("customer-1")).thenReturn(cartWith(new Item(1, 2)));

        mockMvc.perform(get(BASE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerId").value("customer-1"))
                .andExpect(jsonPath("$.items[0].productId").value(1))
                .andExpect(jsonPath("$.items[0].quantity").value(2));
    }

    @Test
    @DisplayName("POST /items/add delegates the item to the service")
    void addItem() throws Exception {
        when(service.addItemToCart(eq("customer-1"), any(Item.class))).thenReturn(cartWith(new Item(7, 3)));

        mockMvc.perform(post(BASE + "/items/add").contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":7,\"quantity\":3}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].productId").value(7));

        verify(service).addItemToCart(eq("customer-1"), org.mockito.ArgumentMatchers.argThat(
                i -> i.getProductId() == 7 && i.getQuantity() == 3));
    }

    @Test
    @DisplayName("PATCH /items/change delegates the item to the service")
    void changeItem() throws Exception {
        when(service.changeItemQuantityFromCart(eq("customer-1"), any(Item.class)))
                .thenReturn(cartWith(new Item(7, 9)));

        mockMvc.perform(patch(BASE + "/items/change").contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":7,\"quantity\":9}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].quantity").value(9));
    }

    // CART-CTL-04
    @Test
    @DisplayName("PATCH /items/remove/{productId} delegates the product id to the service")
    void removeItem() throws Exception {
        when(service.removeItemFromCart("customer-1", 7)).thenReturn(cartWith());

        mockMvc.perform(patch(BASE + "/items/remove/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());
    }

    @Test
    @DisplayName("PATCH /empty returns the emptied cart")
    void emptyCart() throws Exception {
        when(service.emptyCart("customer-1")).thenReturn(cartWith());

        mockMvc.perform(patch(BASE + "/empty"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());
    }

    // ---------- request validation ----------

    // CART-CTL-02
    static Stream<Arguments> invalidItems() {
        return Stream.of(
                Arguments.of("quantity zero", "{\"productId\":1,\"quantity\":0}"),
                Arguments.of("negative quantity", "{\"productId\":1,\"quantity\":-3}"),
                Arguments.of("missing quantity", "{\"productId\":1}"),
                Arguments.of("missing productId", "{\"quantity\":1}"),
                Arguments.of("empty object", "{}"));
    }

    @ParameterizedTest(name = "add rejects {0}")
    @MethodSource("invalidItems")
    void addRejectsInvalidItem(String description, String json) throws Exception {
        mockMvc.perform(post(BASE + "/items/add").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(service);
    }

    @ParameterizedTest(name = "change rejects {0}")
    @MethodSource("invalidItems")
    void changeRejectsInvalidItem(String description, String json) throws Exception {
        mockMvc.perform(patch(BASE + "/items/change").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isBadRequest());

        verify(service, never()).changeItemQuantityFromCart(any(), any());
    }

    // ---------- error translation ----------

    @Test
    @DisplayName("CartException keeps its own status and reports the real request path")
    void cartExceptionKeepsStatusAndPath() throws Exception {
        when(service.addItemToCart(eq("customer-1"), any(Item.class)))
                .thenThrow(new CartException("not enough stock", HttpStatus.BAD_REQUEST));

        mockMvc.perform(post(BASE + "/items/add").contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":1,\"quantity\":1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.error").value("not enough stock"))
                .andExpect(jsonPath("$.path").value(BASE + "/items/add"));
    }

    @Test
    @DisplayName("CartException 404 (item not in cart) is returned as 404")
    void cartExceptionNotFound() throws Exception {
        when(service.changeItemQuantityFromCart(eq("customer-1"), any(Item.class)))
                .thenThrow(new CartException("Item not found in cart with product id: 1", HttpStatus.NOT_FOUND));

        mockMvc.perform(patch(BASE + "/items/change").contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":1,\"quantity\":1}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("CustomerNotFoundException returns 404 with the request path (not a hardcoded one)")
    void customerNotFound() throws Exception {
        when(service.getOrCreateCart("customer-1")).thenThrow(new CustomerNotFoundException("customer-1"));

        mockMvc.perform(get(BASE))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errors.error").value("Customer not found with id: customer-1"))
                .andExpect(jsonPath("$.path").value(BASE));
    }

    @Test
    @DisplayName("ProductNotFoundException returns 404 with the request path (not a hardcoded one)")
    void productNotFound() throws Exception {
        when(service.addItemToCart(eq("customer-1"), any(Item.class))).thenThrow(new ProductNotFoundException(42));

        mockMvc.perform(post(BASE + "/items/add").contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":42,\"quantity\":1}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.path").value(BASE + "/items/add"));
    }

    // CART-HND-01
    @Test
    @DisplayName("downstream 404 is returned as 404 (regression: every FeignException used to become 400)")
    void downstreamNotFoundIs404() throws Exception {
        when(service.getOrCreateCart("customer-1")).thenThrow(CartServiceTest.feignException(404));

        mockMvc.perform(get(BASE))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.path").value(BASE));
    }

    @Test
    @DisplayName("other downstream 4xx statuses are propagated")
    void downstreamClientErrorIsPropagated() throws Exception {
        when(service.getOrCreateCart("customer-1")).thenThrow(CartServiceTest.feignException(409));

        mockMvc.perform(get(BASE)).andExpect(status().isConflict());
    }

    @Test
    @DisplayName("downstream 5xx becomes 502 Bad Gateway without leaking the downstream message")
    void downstreamServerErrorIs502() throws Exception {
        when(service.getOrCreateCart("customer-1")).thenThrow(CartServiceTest.feignException(500));

        mockMvc.perform(get(BASE))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.errors.error").value("Downstream service failed with status 500"));
    }

    @Test
    @DisplayName("downstream unreachable (no HTTP status) becomes 503 Service Unavailable")
    void downstreamUnavailableIs503() throws Exception {
        Request request = Request.create(Request.HttpMethod.GET, "http://downstream/api", java.util.Map.of(), null,
                java.nio.charset.StandardCharsets.UTF_8, null);
        FeignException unreachable = new RetryableException(-1, "connection refused", Request.HttpMethod.GET,
                (Long) null, request);
        when(service.getOrCreateCart("customer-1")).thenThrow(unreachable);

        mockMvc.perform(get(BASE))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.errors.error").value("Downstream service is unavailable"));
    }
}
