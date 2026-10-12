package com.gustavoleterio.microservices.cart_microservice.cart;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gustavoleterio.microservices.cart_microservice.item.Item;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/carts/{customerId}")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping()
    public ResponseEntity<Cart> getOrCreateCart(@PathVariable String customerId) {
        return ResponseEntity.ok(cartService.getOrCreateCart(customerId));
    }

    @PatchMapping("/empty")
    public ResponseEntity<Cart> emptyCart(@PathVariable String customerId) {
        return ResponseEntity.ok(cartService.emptyCart(customerId));
    }

    @PostMapping("/items/add")
    public ResponseEntity<Cart> addItemToCart(@PathVariable String customerId,
            @Valid @RequestBody Item item) {
        return ResponseEntity.ok(cartService.addItemToCart(customerId, item));
    }

    @PatchMapping("/items/change")
    public ResponseEntity<Cart> changeItemQuantityFromCart(@PathVariable String customerId,
            @Valid @RequestBody Item item) {
        return ResponseEntity.ok(cartService.changeItemQuantityFromCart(customerId, item));
    }

    @PatchMapping("/items/remove/{productId}")
    public ResponseEntity<Cart> removeItemFromCart(@PathVariable String customerId,
            @PathVariable Integer productId) {
        return ResponseEntity.ok(cartService.removeItemFromCart(customerId, productId));
    }
}
