package com.junglegym.common;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.util.List;

@Service
public class RateLimitService {
    private static final DefaultRedisScript<Long> SCRIPT = new DefaultRedisScript<>("""
            local count = redis.call('INCR', KEYS[1])
            if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[2]) end
            if count > tonumber(ARGV[1]) then return 0 end
            return 1
            """, Long.class);
    private final StringRedisTemplate redis;
    public RateLimitService(StringRedisTemplate redis) { this.redis = redis; }

    public void check(String bucket, String subject, int limit, Duration window) {
        Long allowed = redis.execute(SCRIPT, List.of("rate-limit:" + bucket + ":" + subject),
                Integer.toString(limit), Long.toString(window.toSeconds()));
        if (!Long.valueOf(1).equals(allowed))
            throw new BusinessException("TOO_MANY_REQUESTS", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", HttpStatus.TOO_MANY_REQUESTS);
    }
}
