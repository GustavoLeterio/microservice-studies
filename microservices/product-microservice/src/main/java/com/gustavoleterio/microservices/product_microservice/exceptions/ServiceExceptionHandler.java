package com.gustavoleterio.microservices.product_microservice.exceptions;

import org.springframework.context.annotation.Primary;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.gustavoleterio.microservices.common_exceptions.GlobalExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

import com.gustavoleterio.microservices.common_exceptions.ErrorResponse;
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
    public ErrorResponse handleCategoryAlreadyExistsException(CategoryAlreadyExistsException ex, HttpServletRequest request) {
        Map<String, String> errors = Map.of("category", ex.getMessage());
        log.warn("Category already exists: {}", errors.toString());
        return buildError(errors, request);
    }

    @ExceptionHandler(CategoryInUseException.class)
    @ResponseStatus(value = HttpStatus.CONFLICT)
    public ErrorResponse handleCategoryInUseException(CategoryInUseException ex, HttpServletRequest request) {
        Map<String, String> errors = Map.of("category", ex.getMessage());
        log.warn("Category in use: {}", errors.toString());
        return buildError(errors, request);
    }

    /**
     * Safety net for database constraint violations that slip past the service checks
     * (e.g. two concurrent requests creating the same category name): 409 instead of 500.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(value = HttpStatus.CONFLICT)
    public ErrorResponse handleDataIntegrityViolation(DataIntegrityViolationException ex, HttpServletRequest request) {
        Map<String, String> errors = Map.of("error", "The operation violates a data integrity constraint");
        log.warn("Data integrity violation: {}", ex.toString());
        return buildError(errors, request);
    }

    @ExceptionHandler(CategoryNotFoundException.class)
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    public ErrorResponse handleCategoryNotFoundException(CategoryNotFoundException ex, HttpServletRequest request) {
        Map<String, String> errors = Map.of("category", ex.getMessage());
        log.warn("Category not found: {}", errors.toString());
        return buildError(errors, request);
    }

    @ExceptionHandler(ProductNotFoundException.class)
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    public ErrorResponse handleProductNotFoundException(ProductNotFoundException ex, HttpServletRequest request) {
        Map<String, String> errors = Map.of("product", ex.getMessage());
        log.warn("Product not found: {}", errors.toString());
        return buildError(errors, request);
    }
}
