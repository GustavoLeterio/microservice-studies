package com.gustavoleterio.microservices.product_microservice.product;

import com.gustavoleterio.microservices.product_microservice.category.Category;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "products")
// @Data is not used because it may cause performance issues because of the lazy loading of the entities
// Instead I'm using the getters and setters to avoid the performance issues
@Getter 
@Setter 
@AllArgsConstructor  
@NoArgsConstructor 
@Builder
public class Product {
    @Id
    @GeneratedValue
    private Integer id;
    @Column (nullable = false)
    @NotNull (message = "Product name is required")
    private String name;
    private String description;
    @Column (nullable = false)
    @NotNull (message = "Product price is required")
    private double price;
    @Column (nullable = false)
    @NotNull (message = "Product stock is required")
    private Integer stock;
    private String imageUrl;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @PrePersist
    public void prePersist() {
        if(this.stock == null) {
            this.stock = 0;
        }
    }
}
