package com.junglegym.common;

import jakarta.servlet.http.HttpServletRequest;

/** The Flask proxy overwrites X-Real-IP. The API must remain private to trusted proxies. */
public final class ClientAddressResolver {
    private ClientAddressResolver() {}

    public static String resolve(HttpServletRequest request) {
        String clientIp = request.getHeader("X-Real-IP");
        return clientIp == null || clientIp.isBlank() ? request.getRemoteAddr() : clientIp;
    }
}
