package com.junglegym.auth;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;

@Repository
public class TokenRepository {
    private final StringRedisTemplate redis;

    public TokenRepository(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public void saveRefresh(String id, Long userId, Duration ttl) {
        redis.opsForValue().set(refreshKey(id), userId.toString(), ttl);
    }

    public String consumeRefresh(String id) {
        return redis.opsForValue().getAndDelete(refreshKey(id));
    }

    public void deleteRefresh(String id) {
        redis.delete(refreshKey(id));
    }

    public boolean isAccessDenied(String id) {
        return Boolean.TRUE.equals(redis.hasKey(accessDenyKey(id)));
    }

    public void denyAccess(String id, Duration remaining) {
        redis.opsForValue().set(accessDenyKey(id), "1", remaining);
    }

    public void deleteAllRefresh(Long userId) {
        var keys = redis.keys("auth:refresh:*");
        if (keys != null) {
            keys.forEach(key -> {
                if (userId.toString().equals(redis.opsForValue().get(key))) {
                    redis.delete(key);
                }
            });
        }
    }

    private String refreshKey(String id) {
        return "auth:refresh:" + id;
    }

    private String accessDenyKey(String id) {
        return "auth:deny:access:" + id;
    }
}
