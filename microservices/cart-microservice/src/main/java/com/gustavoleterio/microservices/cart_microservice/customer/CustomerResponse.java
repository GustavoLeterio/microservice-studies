package com.gustavoleterio.microservices.cart_microservice.customer;

public record CustomerResponse(
    String id,
    String firstName,
    String lastName,
    String email,
    String phone,
    String address,
    String city
) {

}
