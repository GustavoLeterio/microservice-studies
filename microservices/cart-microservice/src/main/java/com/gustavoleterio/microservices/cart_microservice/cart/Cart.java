package com.gustavoleterio.microservices.cart_microservice.cart;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.gustavoleterio.microservices.cart_microservice.exceptions.CartException;
import com.gustavoleterio.microservices.cart_microservice.item.Item;

@Document
@Getter
@NoArgsConstructor
@Builder
public class Cart {
    @Id
    private String customerId;
    @Builder.Default
    private List<Item> items = new ArrayList<>();

    public Cart(String customerId, List<Item> items) {
        this.customerId = customerId;
        setItems(items);
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    /**
     * Always keeps a mutable copy, so callers can pass List.of(...) or null
     * without making later add/remove operations fail.
     */
    public void setItems(List<Item> items) {
        this.items = items == null ? new ArrayList<>() : new ArrayList<>(items);
    }

    public void addItem(Item newItem) {
        ensureItems();
        Optional<Item> itemMatch = findItem(newItem.getProductId());

        if (itemMatch.isPresent())
            throw new CartException("Item already exists in cart with product id: "
                    + newItem.getProductId() +
                    ". Use PATCH /{customerId}/items/change to change the item quantity.",
                    HttpStatus.BAD_REQUEST);

        this.items.add(newItem);
    }

    public void changeItemQuantityFromCart(Item item) {
        ensureItems();
        Item itemMatch = findItem(item.getProductId())
                .orElseThrow(() -> new CartException(
                        "Item not found in cart with product id: " + item.getProductId(),
                        HttpStatus.NOT_FOUND));

        itemMatch.setQuantity(item.getQuantity());
    }

    public void removeItem(Integer productId) {
        ensureItems();
        this.items.removeIf(i -> Objects.equals(i.getProductId(), productId));
    }

    private Optional<Item> findItem(Integer productId) {
        // Objects.equals: Integer must never be compared with == (only cached for -128..127)
        return this.items.stream()
                .filter(i -> Objects.equals(i.getProductId(), productId))
                .findFirst();
    }

    private void ensureItems() {
        if (this.items == null) {
            this.items = new ArrayList<>();
        }
    }
}
