package com.gustavoleterio.microservices.common_exceptions;

import java.util.Map;

public record ErrorResponse(Map<String, String> errors, String timestamp, String path) {

}
