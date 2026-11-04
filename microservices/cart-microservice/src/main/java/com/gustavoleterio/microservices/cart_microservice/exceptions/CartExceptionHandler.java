package com.gustavoleterio.microservices.cart_microservice.exceptions;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;

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

    /**
     * Translates a failed call to another microservice into a meaningful status:
     * 4xx from downstream keeps its status (e.g. 404 stays 404), 5xx becomes 502 and
     * a call that never got a response (no status) becomes 503.
     */
    @ExceptionHandler(FeignException.class)
    public ResponseEntity<ErrorResponse> handleFeignException(FeignException ex, HttpServletRequest request) {
        log.warn("FeignException: {}", ex.getMessage());
        int downstreamStatus = ex.status();
        HttpStatus status;
        String message;
        if (downstreamStatus >= 400 && downstreamStatus < 500) {
            status = HttpStatus.resolve(downstreamStatus) != null ? HttpStatus.resolve(downstreamStatus)
                    : HttpStatus.BAD_REQUEST;
            message = "Downstream service rejected the request with status " + downstreamStatus;
        } else if (downstreamStatus >= 500) {
            status = HttpStatus.BAD_GATEWAY;
            message = "Downstream service failed with status " + downstreamStatus;
        } else {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            message = "Downstream service is unavailable";
        }
        return ResponseEntity.status(status).body(buildError(message, request));
    }

    @ExceptionHandler(CartException.class)
    public ResponseEntity<ErrorResponse> handleCartException(CartException ex, HttpServletRequest request) {
        log.warn("CartException: {}", ex.getMessage());
        return ResponseEntity.status(ex.getHttpStatus()).body(buildError(ex.getMessage(), request));
    }

    @ExceptionHandler(CustomerNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCustomerNotFoundException(CustomerNotFoundException ex,
            HttpServletRequest request) {
        log.warn("CustomerNotFoundException: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(buildError(ex.getMessage(), request));
    }

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProductNotFoundException(ProductNotFoundException ex,
            HttpServletRequest request) {
        log.warn("ProductNotFoundException: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(buildError(ex.getMessage(), request));
    }

    private ErrorResponse buildError(String message, HttpServletRequest request) {
        return new ErrorResponse(Map.of("error", message), LocalDateTime.now().toString(), request.getRequestURI());
    }

}
