package com.gustavoleterio.microservices.customer_microservice.exceptions;

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
public class CustomerExceptionHandler extends GlobalExceptionHandler {

    @ExceptionHandler(CustomerNotFoundException.class)
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    public ErrorResponse handleCustomerNotFoundException(CustomerNotFoundException ex) {
        Map<String, String> errors = Map.of("customer", ex.getMessage());
        log.warn("Customer not found: {}", errors.toString());
        return new ErrorResponse(errors, LocalDateTime.now().toString(), "/");
    }

}
