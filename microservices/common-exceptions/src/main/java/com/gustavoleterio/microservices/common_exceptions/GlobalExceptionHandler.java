package com.gustavoleterio.microservices.common_exceptions;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.stereotype.Component;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Component
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private static final String MISSING_BODY_PREFIX = "Required request body is missing";

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        log.warn("Method argument not valid: {}", ex.toString());
        return buildError(errors, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleHttpMessageNotReadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        String message = ex.getMessage();
        if (message != null && message.startsWith(MISSING_BODY_PREFIX)) {
            errors.put("error", "Request body is missing");
        } else {
            errors.put("error", "Request body is malformed or has invalid values");
        }
        log.warn("Request body not readable: {}", ex.toString());
        return buildError(errors, request);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        errors.put(ex.getName(), "Invalid value for parameter '" + ex.getName() + "'");
        log.warn("Method argument type mismatch: {}", ex.toString());
        return buildError(errors, request);
    }

    /**
     * Catch-all. Client errors raised by Spring MVC itself (405, 415, 404 for unknown routes...)
     * keep their own 4xx status; anything else is reported as a generic 500 without internal details.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        if (ex instanceof org.springframework.web.ErrorResponse springError
                && springError.getStatusCode().is4xxClientError()) {
            errors.put("error", springError.getBody().getDetail() != null
                    ? springError.getBody().getDetail()
                    : "The request could not be processed");
            log.warn("Client error: {}", ex.toString());
            return ResponseEntity.status(springError.getStatusCode()).body(buildError(errors, request));
        }
        errors.put("error", "An unexpected error occurred");
        log.error("An unexpected error occurred: {}", ex.toString());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(buildError(errors, request));
    }

    /**
     * Builds the standard error payload using the real request path, so subclasses
     * (service specific advices) report the same shape and the same path.
     */
    protected ErrorResponse buildError(Map<String, String> errors, HttpServletRequest request) {
        return new ErrorResponse(errors, LocalDateTime.now().toString(), request.getRequestURI());
    }
}
