package com.gustavoleterio.microservices.customer_microservice.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;


public record CustomerRequest(
        @NotBlank(message = "First name is required")
        String firstName,
        @NotBlank(message = "Last name is required")
        String lastName,
        @Email(message = "Invalid email address")
        @NotBlank(message = "Email is required")
        String email,
        String phone,
        String address,
        String city) {

}
