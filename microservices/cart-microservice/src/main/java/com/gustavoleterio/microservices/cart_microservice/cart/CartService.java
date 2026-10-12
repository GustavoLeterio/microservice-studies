package com.gustavoleterio.microservices.cart_microservice.cart;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.gustavoleterio.microservices.cart_microservice.customer.CustomerClient;
import com.gustavoleterio.microservices.cart_microservice.exceptions.CartException;
import com.gustavoleterio.microservices.cart_microservice.exceptions.CustomerNotFoundException;
import com.gustavoleterio.microservices.cart_microservice.exceptions.ProductNotFoundException;
import com.gustavoleterio.microservices.cart_microservice.item.Item;
import com.gustavoleterio.microservices.cart_microservice.product.ProductClient;
import com.gustavoleterio.microservices.cart_microservice.product.ProductResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CartService {

    private final ProductClient productClient;
    private final CustomerClient customerClient;
    private final CartRepository cartRepository;

    public Cart getOrCreateCart(String customerId) {
        validateIfCustomerExists(customerId);
        return cartRepository.findById(customerId).orElseGet(() -> {
            Cart cart = new Cart(customerId, List.of());
            return cartRepository.save(cart);
        });
    }

    public Cart addItemToCart(String customerId, Item item) {
        validateIfItemCanBePersisted(customerId, item);
        Cart cart = getOrCreateCart(customerId);
        cart.addItem(new Item(item.getProductId(), item.getQuantity()));
        return cartRepository.save(cart);
    }

    public Cart changeItemQuantityFromCart(String customerId, Item item) {
        validateIfItemCanBePersisted(customerId, item);
        Cart cart = getOrCreateCart(customerId);
        cart.changeItemQuantityFromCart(item);
        return cartRepository.save(cart);
    }

    public Cart removeItemFromCart(String customerId, Integer productId) {
        Cart cart = getOrCreateCart(customerId);
        cart.removeItem(productId);
        return cartRepository.save(cart);
    }

    public Cart emptyCart(String customerId) {
        Cart cart = getOrCreateCart(customerId);
        cart.setItems(List.of());
        return cartRepository.save(cart);
    }

    private void validateIfItemCanBePersisted(String customerId, Item item) {
        validateIfCustomerExists(customerId);
        ProductResponse productResponse = productClient.getProductById(item.getProductId())
                .orElseThrow(() -> new ProductNotFoundException(item.getProductId()));
        if (item.getQuantity() > productResponse.stock()) 
            throw new CartException(
                    "Product stock is not enough for product with id: " + item.getProductId(),
                    HttpStatus.BAD_REQUEST);
    }

    private void validateIfCustomerExists(String customerId) {   
        customerClient.getCustomerById(customerId).orElseThrow(() -> new CustomerNotFoundException(customerId));
    }

}
