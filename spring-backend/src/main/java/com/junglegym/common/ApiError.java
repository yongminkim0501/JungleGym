package com.junglegym.common;

import java.time.Instant;
import java.util.Map;

public record ApiError(
        boolean success,
        String code,
        String message,
        Map<String, String> fieldErrors,
        Instant timestamp
) {
    public static ApiError of(String code, String message) {
        return new ApiError(false, code, message, Map.of(), Instant.now());
    }
}
