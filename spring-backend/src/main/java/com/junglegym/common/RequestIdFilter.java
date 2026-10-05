package com.junglegym.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Tags every request and its log lines with an ID that is also returned to the client,
 * so a user-reported error can be matched to the server log.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {
    public static final String HEADER = "X-Request-Id";
    public static final String MDC_KEY = "requestId";
    static final long SLOW_MS = 1000;
    private static final Logger log = LoggerFactory.getLogger(RequestIdFilter.class);
    // The Next proxy supplies its own ID; anything else from the client must not be able to forge log lines.
    private static final Pattern VALID = Pattern.compile("[A-Za-z0-9-]{8,64}");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String incoming = request.getHeader(HEADER);
        String requestId = incoming != null && VALID.matcher(incoming).matches() ? incoming : UUID.randomUUID().toString();
        MDC.put(MDC_KEY, requestId);
        response.setHeader(HEADER, requestId);
        long started = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            long elapsedMs = (System.nanoTime() - started) / 1_000_000;
            int status = response.getStatus();
            // Query strings are omitted on purpose: they can carry codes or tokens.
            if (status >= 500) log.warn("{} {} -> {} in {}ms", request.getMethod(), request.getRequestURI(), status, elapsedMs);
            else if (elapsedMs >= SLOW_MS) log.warn("Slow request {} {} -> {} in {}ms", request.getMethod(), request.getRequestURI(), status, elapsedMs);
            MDC.remove(MDC_KEY);
        }
    }
}
