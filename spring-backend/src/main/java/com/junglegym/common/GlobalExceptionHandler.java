package com.junglegym.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler({MissingServletRequestParameterException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<ApiError> handleRequestParameter(Exception exception) {
        return ResponseEntity.badRequest()
                .body(ApiError.of("INVALID_REQUEST", "필수 요청 파라미터와 형식을 확인해주세요."));
    }

    @ExceptionHandler(BusinessException.class)
    ResponseEntity<ApiError> handleBusiness(BusinessException exception) {
        if (exception.getStatus().is5xxServerError())
            log.warn("Business error {}: {}", exception.getCode(), exception.getMessage());
        return ResponseEntity.status(exception.getStatus())
                .body(ApiError.of(exception.getCode(), exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ApiError(
                false, "INVALID_REQUEST", "입력값을 확인해주세요.", fields, Instant.now()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> handleConflict(DataIntegrityViolationException exception) {
        // Usually a duplicate racing past the service checks; keep the constraint name for diagnosis.
        log.warn("Data integrity violation: {}", exception.getMostSpecificCause().getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiError.of("RESOURCE_CONFLICT", "이미 존재하거나 현재 상태와 충돌하는 데이터입니다."));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> handleUnreadable(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(ApiError.of("INVALID_REQUEST", "요청 본문 형식이 올바르지 않습니다."));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> handleUnexpected(Exception exception) {
        log.error("Unhandled exception", exception);
        return ResponseEntity.internalServerError()
                .body(ApiError.of("INTERNAL_SERVER_ERROR", "요청 처리 중 오류가 발생했습니다."));
    }
}
