package com.gustavoleterio.microservices.cart_microservice.cart;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import com.gustavoleterio.microservices.cart_microservice.exceptions.CartException;
import com.gustavoleterio.microservices.cart_microservice.item.Item;

/**
 * Domain rules of the cart. Product ids above 127 are used on purpose: boxed Integers
 * outside the -128..127 cache are different objects, which exposes any use of '=='.
 */
class CartTest {

    /** Distinct boxed instances with the same value (outside the Integer cache). */
    private static final Integer LARGE_ID_A = Integer.valueOf(1000);
    private static final Integer LARGE_ID_B = Integer.valueOf(1000);

    @Test
    @DisplayName("sanity: the large ids really are different objects with the same value")
    void largeIdsAreDistinctInstances() {
        assertThat(LARGE_ID_A).isNotSameAs(LARGE_ID_B).isEqualTo(LARGE_ID_B);
    }

    // CART-DOM-01
    @Test
    @DisplayName("addItem works on a cart created with an immutable List.of()")
    void addItemWorksWhenCartWasCreatedWithImmutableList() {
        Cart cart = new Cart("c1", List.of());

        cart.addItem(new Item(1, 2));

        assertThat(cart.getItems()).hasSize(1);
    }

    @Test
    @DisplayName("addItem works after setItems(List.of()) (empty cart scenario)")
    void addItemWorksAfterSetItemsWithImmutableList() {
        Cart cart = new Cart("c1", new ArrayList<>(List.of(new Item(1, 1))));

        cart.setItems(List.of());
        cart.addItem(new Item(2, 1));

        assertThat(cart.getItems()).extracting(Item::getProductId).containsExactly(2);
    }

    @Test
    @DisplayName("null items (e.g. document without the field) behave as an empty cart")
    void nullItemsBehaveAsEmptyCart() {
        Cart cart = new Cart("c1", null);

        assertThat(cart.getItems()).isNotNull().isEmpty();
        cart.addItem(new Item(1, 1));
        assertThat(cart.getItems()).hasSize(1);
    }

    @Test
    @DisplayName("builder without items yields a mutable empty list")
    void builderDefaultsToMutableEmptyList() {
        Cart cart = Cart.builder().customerId("c1").build();

        cart.addItem(new Item(1, 1));

        assertThat(cart.getItems()).hasSize(1);
    }

    // CART-DOM-05
    @Test
    @DisplayName("addItem rejects a duplicated product (small id) with 400 and a hint to use PATCH /items/change")
    void addItemRejectsDuplicateWithSmallId() {
        Cart cart = new Cart("c1", new ArrayList<>(List.of(new Item(5, 1))));

        assertThatThrownBy(() -> cart.addItem(new Item(5, 3)))
                .isInstanceOfSatisfying(CartException.class, e -> {
                    assertThat(e.getHttpStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(e.getMessage()).contains("5").contains("PATCH").contains("/items/change");
                });
        assertThat(cart.getItems()).hasSize(1);
    }

    // CART-DOM-02
    @Test
    @DisplayName("addItem rejects a duplicated product even when the id is outside the Integer cache")
    void addItemRejectsDuplicateWithLargeId() {
        Cart cart = new Cart("c1", new ArrayList<>(List.of(new Item(LARGE_ID_A, 1))));

        assertThatThrownBy(() -> cart.addItem(new Item(LARGE_ID_B, 1)))
                .isInstanceOf(CartException.class);
        assertThat(cart.getItems()).hasSize(1);
    }

    // CART-DOM-03
    @Test
    @DisplayName("changeItemQuantity finds the item when the id is outside the Integer cache")
    void changeQuantityFindsItemWithLargeId() {
        Cart cart = new Cart("c1", new ArrayList<>(List.of(new Item(LARGE_ID_A, 1))));

        cart.changeItemQuantityFromCart(new Item(LARGE_ID_B, 7));

        assertThat(cart.getItems()).singleElement().extracting(Item::getQuantity).isEqualTo(7);
    }

    @Test
    @DisplayName("changeItemQuantity fails with 404 when the product is not in the cart")
    void changeQuantityFailsWhenItemMissing() {
        Cart cart = new Cart("c1", new ArrayList<>(List.of(new Item(1, 1))));

        assertThatThrownBy(() -> cart.changeItemQuantityFromCart(new Item(2, 5)))
                .isInstanceOfSatisfying(CartException.class, e -> {
                    assertThat(e.getHttpStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(e.getMessage()).contains("2");
                });
        assertThat(cart.getItems()).singleElement().extracting(Item::getQuantity).isEqualTo(1);
    }

    // CART-DOM-04
    @Test
    @DisplayName("removeItem removes the item when the id is outside the Integer cache")
    void removeItemWorksWithLargeId() {
        Cart cart = new Cart("c1", new ArrayList<>(List.of(new Item(LARGE_ID_A, 1), new Item(2, 1))));

        cart.removeItem(LARGE_ID_B);

        assertThat(cart.getItems()).extracting(Item::getProductId).containsExactly(2);
    }

    @Test
    @DisplayName("removeItem on a product that is not in the cart leaves the cart unchanged")
    void removeItemOfMissingProductIsNoOp() {
        Cart cart = new Cart("c1", new ArrayList<>(List.of(new Item(1, 1))));

        cart.removeItem(99);

        assertThat(cart.getItems()).hasSize(1);
    }

    @Test
    @DisplayName("removeItem only removes the matching product")
    void removeItemKeepsOtherProducts() {
        Cart cart = new Cart("c1", new ArrayList<>(List.of(new Item(1, 1), new Item(2, 1), new Item(3, 1))));

        cart.removeItem(2);

        assertThat(cart.getItems()).extracting(Item::getProductId).containsExactly(1, 3);
    }
}
