package com.gustavoleterio.microservices.cart_microservice.product;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Optional;

@FeignClient(name = "PRODUCT-MICROSERVICE")
public interface ProductClient {

    @GetMapping("/api/v1/products/{id}")
    Optional<ProductResponse> getProductById(@PathVariable("id") Integer productId);
}
