package com.gustavoleterio.microservices.cart_microservice.exceptions;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.gustavoleterio.microservices.common_exceptions.ErrorResponse;

import feign.FeignException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class CartExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(FeignException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleFeignException(FeignException ex) {
        log.warn("FeignException: {}", ex.getMessage());
        return new ErrorResponse(Map.of("error", ex.getMessage()), LocalDateTime.now().toString(), "/api/v1/carts");
    }

    @ExceptionHandler(CartException.class)
    public ResponseEntity<ErrorResponse> handleCartException(CartException ex) {
        log.warn("CartException: {}", ex.getMessage());
        return ResponseEntity.status(ex.getHttpStatus().value()).body(new ErrorResponse(Map.of("error", ex.getMessage()), LocalDateTime.now().toString(), "/api/v1/carts"));
    }

    @ExceptionHandler(CustomerNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleCustomerNotFoundException(CustomerNotFoundException ex) {
        log.warn("CustomerNotFoundException: {}", ex.getMessage());
        return new ErrorResponse(Map.of("error", ex.getMessage()), LocalDateTime.now().toString(), "/api/v1/customer");
    }

    @ExceptionHandler(ProductNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleProductNotFoundException(ProductNotFoundException ex) {
        log.warn("ProductNotFoundException: {}", ex.getMessage());
        return new ErrorResponse(Map.of("error", ex.getMessage()), LocalDateTime.now().toString(), "/api/v1/product");
    }

}
