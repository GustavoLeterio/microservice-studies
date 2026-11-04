package com.gustavoleterio.microservices.cart_microservice.cart;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;

import com.gustavoleterio.microservices.cart_microservice.customer.CustomerClient;
import com.gustavoleterio.microservices.cart_microservice.customer.CustomerResponse;
import com.gustavoleterio.microservices.cart_microservice.exceptions.CartException;
import com.gustavoleterio.microservices.cart_microservice.exceptions.CustomerNotFoundException;
import com.gustavoleterio.microservices.cart_microservice.exceptions.ProductNotFoundException;
import com.gustavoleterio.microservices.cart_microservice.item.Item;
import com.gustavoleterio.microservices.cart_microservice.product.ProductClient;
import com.gustavoleterio.microservices.cart_microservice.product.ProductResponse;

import feign.FeignException;
import feign.Request;
import feign.Response;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CartServiceTest {

    private static final String CUSTOMER_ID = "customer-1";

    @Mock
    private ProductClient productClient;
    @Mock
    private CustomerClient customerClient;
    @Mock
    private CartRepository cartRepository;
    @InjectMocks
    private CartService service;

    @BeforeEach
    void setUp() {
        // By default the customer exists, nothing is persisted yet and save returns what it receives
        when(customerClient.getCustomerById(anyString())).thenReturn(Optional
                .of(new CustomerResponse("id", "John", "Doe", "john@doe.com", "123", "street", "city")));
        when(cartRepository.findById(anyString())).thenReturn(Optional.empty());
        when(cartRepository.save(any(Cart.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static ProductResponse product(int id, Integer stock) {
        return new ProductResponse(id, "p" + id, "desc", 10.0, stock, null, 1, "cat", "catDesc");
    }

    private void productExists(int id, Integer stock) {
        when(productClient.getProductById(id)).thenReturn(Optional.of(product(id, stock)));
    }

    private Cart existingCart(Item... items) {
        Cart cart = new Cart(CUSTOMER_ID, new ArrayList<>(List.of(items)));
        when(cartRepository.findById(CUSTOMER_ID)).thenReturn(Optional.of(cart));
        return cart;
    }

    // ---------- getOrCreateCart ----------

    // CART-SVC-01
    @Test
    @DisplayName("getOrCreateCart returns the persisted cart without saving a new one")
    void getOrCreateCartReturnsExisting() {
        Cart cart = existingCart(new Item(1, 1));

        Cart result = service.getOrCreateCart(CUSTOMER_ID);

        assertThat(result).isSameAs(cart);
        verify(cartRepository, never()).save(any());
    }

    @Test
    @DisplayName("getOrCreateCart creates and saves an empty cart when none exists")
    void getOrCreateCartCreatesEmptyCart() {
        Cart result = service.getOrCreateCart(CUSTOMER_ID);

        assertThat(result.getCustomerId()).isEqualTo(CUSTOMER_ID);
        assertThat(result.getItems()).isEmpty();
        verify(cartRepository).save(result);
    }

    @Test
    @DisplayName("getOrCreateCart rejects unknown customers before touching the repository")
    void getOrCreateCartUnknownCustomer() {
        when(customerClient.getCustomerById("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getOrCreateCart("ghost"))
                .isInstanceOf(CustomerNotFoundException.class)
                .hasMessageContaining("ghost");
        verifyNoInteractions(cartRepository);
    }

    // ---------- addItemToCart ----------

    // CART-SVC-02
    @Test
    @DisplayName("first item added to a brand new cart works (regression: List.of() crashed here)")
    void addItemToBrandNewCart() {
        productExists(10, 5);

        Cart result = service.addItemToCart(CUSTOMER_ID, new Item(10, 2));

        assertThat(result.getItems()).singleElement().satisfies(i -> {
            assertThat(i.getProductId()).isEqualTo(10);
            assertThat(i.getQuantity()).isEqualTo(2);
        });
    }

    // CART-SVC-04
    @Test
    @DisplayName("addItem appends to an existing cart and persists it")
    void addItemToExistingCart() {
        existingCart(new Item(1, 1));
        productExists(2, 10);

        Cart result = service.addItemToCart(CUSTOMER_ID, new Item(2, 3));

        assertThat(result.getItems()).extracting(Item::getProductId).containsExactly(1, 2);
        verify(cartRepository).save(result);
    }

    @Test
    @DisplayName("addItem accepts a quantity equal to the available stock (boundary)")
    void addItemAcceptsQuantityEqualToStock() {
        productExists(10, 5);

        Cart result = service.addItemToCart(CUSTOMER_ID, new Item(10, 5));

        assertThat(result.getItems()).singleElement().extracting(Item::getQuantity).isEqualTo(5);
    }

    // CART-SVC-03
    @Test
    @DisplayName("addItem rejects a quantity above stock with 400 and persists nothing")
    void addItemRejectsInsufficientStock() {
        productExists(10, 5);

        assertThatThrownBy(() -> service.addItemToCart(CUSTOMER_ID, new Item(10, 6)))
                .isInstanceOfSatisfying(CartException.class, e -> {
                    assertThat(e.getHttpStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(e.getMessage()).contains("10");
                });
        verify(cartRepository, never()).save(any());
    }

    @Test
    @DisplayName("addItem treats a product with unknown (null) stock as out of stock instead of throwing NPE")
    void addItemWithNullStockIsRejectedGracefully() {
        productExists(10, null);

        assertThatThrownBy(() -> service.addItemToCart(CUSTOMER_ID, new Item(10, 1)))
                .isInstanceOfSatisfying(CartException.class,
                        e -> assertThat(e.getHttpStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(cartRepository, never()).save(any());
    }

    // CART-SVC-05
    @Test
    @DisplayName("addItem fails with ProductNotFoundException when the catalog has no such product")
    void addItemUnknownProduct() {
        when(productClient.getProductById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addItemToCart(CUSTOMER_ID, new Item(99, 1)))
                .isInstanceOf(ProductNotFoundException.class)
                .hasMessageContaining("99");
        verify(cartRepository, never()).save(any());
    }

    @Test
    @DisplayName("addItem checks the customer first and never calls the product service for unknown customers")
    void addItemUnknownCustomerDoesNotQueryProducts() {
        when(customerClient.getCustomerById("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addItemToCart("ghost", new Item(1, 1)))
                .isInstanceOf(CustomerNotFoundException.class);
        verifyNoInteractions(productClient);
        verify(cartRepository, never()).save(any());
    }

    @Test
    @DisplayName("addItem rejects a product that is already in the cart and does not persist")
    void addItemDuplicateProduct() {
        existingCart(new Item(10, 1));
        productExists(10, 50);

        assertThatThrownBy(() -> service.addItemToCart(CUSTOMER_ID, new Item(10, 2)))
                .isInstanceOfSatisfying(CartException.class,
                        e -> assertThat(e.getHttpStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(cartRepository, never()).save(any());
    }

    @Test
    @DisplayName("addItem stores a copy of the item, so later changes to the request do not alter the cart")
    void addItemStoresCopyOfRequestItem() {
        productExists(10, 5);
        Item request = new Item(10, 2);

        Cart result = service.addItemToCart(CUSTOMER_ID, request);
        request.setQuantity(100);

        assertThat(result.getItems()).singleElement().extracting(Item::getQuantity).isEqualTo(2);
    }

    @Test
    @DisplayName("downstream failures (Feign) are not swallowed by the service")
    void feignFailureIsPropagated() {
        FeignException failure = feignException(500);
        when(productClient.getProductById(10)).thenThrow(failure);

        assertThatThrownBy(() -> service.addItemToCart(CUSTOMER_ID, new Item(10, 1))).isSameAs(failure);
        verify(cartRepository, never()).save(any());
    }

    // ---------- changeItemQuantityFromCart ----------

    @Test
    @DisplayName("changeItemQuantity updates the quantity of an existing item and persists")
    void changeQuantityHappyPath() {
        existingCart(new Item(10, 1));
        productExists(10, 8);

        Cart result = service.changeItemQuantityFromCart(CUSTOMER_ID, new Item(10, 8));

        assertThat(result.getItems()).singleElement().extracting(Item::getQuantity).isEqualTo(8);
        verify(cartRepository).save(result);
    }

    // CART-SVC-06
    @Test
    @DisplayName("changeItemQuantity returns 404 when the product exists but is not in the cart")
    void changeQuantityItemNotInCart() {
        existingCart(new Item(1, 1));
        productExists(10, 8);

        assertThatThrownBy(() -> service.changeItemQuantityFromCart(CUSTOMER_ID, new Item(10, 2)))
                .isInstanceOfSatisfying(CartException.class,
                        e -> assertThat(e.getHttpStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        verify(cartRepository, never()).save(any());
    }

    @Test
    @DisplayName("changeItemQuantity rejects a quantity above stock and keeps the old quantity")
    void changeQuantityAboveStock() {
        Cart cart = existingCart(new Item(10, 1));
        productExists(10, 3);

        assertThatThrownBy(() -> service.changeItemQuantityFromCart(CUSTOMER_ID, new Item(10, 4)))
                .isInstanceOf(CartException.class);
        assertThat(cart.getItems()).singleElement().extracting(Item::getQuantity).isEqualTo(1);
        verify(cartRepository, never()).save(any());
    }

    // ---------- removeItemFromCart ----------

    @Test
    @DisplayName("removeItem removes the product and persists the cart")
    void removeItemHappyPath() {
        existingCart(new Item(1, 1), new Item(2, 1));

        Cart result = service.removeItemFromCart(CUSTOMER_ID, 1);

        assertThat(result.getItems()).extracting(Item::getProductId).containsExactly(2);
        verify(cartRepository).save(result);
    }

    @Test
    @DisplayName("removeItem of a product that is not in the cart returns the cart unchanged")
    void removeItemMissingProduct() {
        existingCart(new Item(1, 1));

        Cart result = service.removeItemFromCart(CUSTOMER_ID, 99);

        assertThat(result.getItems()).hasSize(1);
        verifyNoInteractions(productClient);
    }

    @Test
    @DisplayName("removeItem works on a cart that was just created (empty immutable list scenario)")
    void removeItemOnBrandNewCart() {
        Cart result = service.removeItemFromCart(CUSTOMER_ID, 1);

        assertThat(result.getItems()).isEmpty();
    }

    // ---------- emptyCart ----------

    @Test
    @DisplayName("emptyCart removes every item and persists")
    void emptyCartHappyPath() {
        existingCart(new Item(1, 1), new Item(2, 1));

        Cart result = service.emptyCart(CUSTOMER_ID);

        assertThat(result.getItems()).isEmpty();
        verify(cartRepository).save(result);
    }

    // CART-SVC-08
    @Test
    @DisplayName("an emptied cart still accepts new items (regression: setItems(List.of()) made add crash)")
    void emptyThenAddWorks() {
        Cart cart = existingCart(new Item(1, 1));
        productExists(2, 5);

        service.emptyCart(CUSTOMER_ID);
        Cart result = service.addItemToCart(CUSTOMER_ID, new Item(2, 1));

        assertThat(result).isSameAs(cart);
        assertThat(result.getItems()).extracting(Item::getProductId).containsExactly(2);
    }

    @Test
    @DisplayName("emptyCart on an unknown customer fails and persists nothing")
    void emptyCartUnknownCustomer() {
        when(customerClient.getCustomerById("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.emptyCart("ghost")).isInstanceOf(CustomerNotFoundException.class);
        verify(cartRepository, never()).save(any());
        verify(productClient, never()).getProductById(anyInt());
    }

    // ---------- helpers ----------

    static FeignException feignException(int status) {
        Request request = Request.create(Request.HttpMethod.GET, "http://downstream/api", java.util.Map.of(), null,
                java.nio.charset.StandardCharsets.UTF_8, null);
        Response response = Response.builder().status(status).reason("reason").request(request)
                .headers(java.util.Map.of()).build();
        return FeignException.errorStatus("Client#method", response);
    }
}
