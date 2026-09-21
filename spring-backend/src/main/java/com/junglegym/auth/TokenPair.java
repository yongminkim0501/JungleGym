package com.junglegym.auth;

import java.time.Duration;

/** Token values and lifetimes; cookie serialization belongs to the web adapter. */
public record TokenPair(String accessToken, String refreshToken, Duration accessTtl, Duration refreshTtl) {}
