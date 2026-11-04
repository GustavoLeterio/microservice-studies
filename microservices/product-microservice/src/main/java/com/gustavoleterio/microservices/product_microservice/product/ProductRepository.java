package com.gustavoleterio.microservices.product_microservice.product;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    List<Product> findByCategoryId(Integer categoryId);

    boolean existsByCategoryId(Integer categoryId);

}
