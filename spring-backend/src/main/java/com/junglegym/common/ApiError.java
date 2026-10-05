package com.junglegym.common;

import org.slf4j.MDC;
import java.time.Instant;
import java.util.Map;

public record ApiError(
        boolean success,
        String code,
        String message,
        Map<String, String> fieldErrors,
        Instant timestamp,
        String requestId
) {
    public ApiError(boolean success, String code, String message, Map<String, String> fieldErrors, Instant timestamp) {
        this(success, code, message, fieldErrors, timestamp, MDC.get(RequestIdFilter.MDC_KEY));
    }

    public static ApiError of(String code, String message) {
        return new ApiError(false, code, message, Map.of(), Instant.now());
    }
}
