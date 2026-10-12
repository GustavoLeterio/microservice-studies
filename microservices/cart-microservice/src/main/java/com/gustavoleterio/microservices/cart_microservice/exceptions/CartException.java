package com.gustavoleterio.microservices.cart_microservice.exceptions;

import org.springframework.http.HttpStatus;

import lombok.Getter;

@Getter 
public class CartException extends RuntimeException {
    private final HttpStatus httpStatus;
    public CartException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }
}
