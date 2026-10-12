package com.gustavoleterio.microservices.product_microservice.product;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    Optional<List<Product>> findByCategoryId(Integer categoryId);

}
