package com.gustavoleterio.microservices.product_microservice.exceptions;

import org.springframework.context.annotation.Primary;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.gustavoleterio.microservices.common_exceptions.GlobalExceptionHandler;

import lombok.extern.slf4j.Slf4j;

import com.gustavoleterio.microservices.common_exceptions.ErrorResponse;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestControllerAdvice
@Primary 
@Slf4j 
public class ServiceExceptionHandler extends GlobalExceptionHandler {

    @ExceptionHandler(CategoryAlreadyExistsException.class)
    @ResponseStatus(value = HttpStatus.CONFLICT)
    public ErrorResponse handleCategoryAlreadyExistsException(CategoryAlreadyExistsException ex) {
        Map<String, String> errors = Map.of("category", ex.getMessage());
        log.warn("Category already exists: {}", errors.toString());
        return new ErrorResponse(errors, LocalDateTime.now().toString(), "/");
    }

    @ExceptionHandler(CategoryNotFoundException.class)
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    public ErrorResponse handleCategoryNotFoundException(CategoryNotFoundException ex) {
        Map<String, String> errors = Map.of("category", ex.getMessage());
        log.warn("Category not found: {}", errors.toString());
        return new ErrorResponse(errors, LocalDateTime.now().toString(), "/");
    }

    @ExceptionHandler(ProductNotFoundException.class)
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    public ErrorResponse handleProductNotFoundException(ProductNotFoundException ex) {
        Map<String, String> errors = Map.of("product", ex.getMessage());
        log.warn("Product not found: {}", errors.toString());
        return new ErrorResponse(errors, LocalDateTime.now().toString(), "/");
    }
}
