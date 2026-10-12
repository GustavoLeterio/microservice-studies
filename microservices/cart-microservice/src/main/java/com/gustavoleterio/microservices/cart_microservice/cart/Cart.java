package com.gustavoleterio.microservices.cart_microservice.cart;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.gustavoleterio.microservices.cart_microservice.exceptions.CartException;
import com.gustavoleterio.microservices.cart_microservice.item.Item;

@Document
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart {
    @Id
    private String customerId;
    private List<Item> items;

    public void addItem(Item newItem) {
        Optional<Item> itemMatch = this.items.stream().filter(i -> i.getProductId() == newItem.getProductId())
                .findFirst();

        if (!itemMatch.isEmpty())
            throw new CartException("Item already exists in cart with product id: "
                    + newItem.getProductId() +
                    ". Use /{customerId}/items/{productId} to change the item quantity. "
                    , HttpStatus.BAD_REQUEST);

        this.items.add(newItem);
    }

    public void changeItemQuantityFromCart(Item item) {
        Optional<Item> itemMatch = this.items.stream().filter(i -> i.getProductId() == item.getProductId())
                .findFirst();
        if (itemMatch.isEmpty())
            throw new CartException("Item not found in cart with product id: " + item.getProductId(),
                    HttpStatus.NOT_FOUND);
                    
        itemMatch.get().setQuantity(item.getQuantity());
    }

    public void removeItem(Integer productId) {
        this.items.removeIf(i -> i.getProductId() == productId);
    }
}
