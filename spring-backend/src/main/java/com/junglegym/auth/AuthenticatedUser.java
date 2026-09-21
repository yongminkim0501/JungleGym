package com.junglegym.auth;

import com.junglegym.user.User;
import java.io.Serializable;

public record AuthenticatedUser(
        Long id,
        String email,
        String nickname,
        String name,
        String profileImageUrl
) implements Serializable {
    public static AuthenticatedUser from(User user) {
        return new AuthenticatedUser(user.getId(), user.getEmail(), user.getNickname(), user.getName(),
                user.getProfileImageUrl());
    }
}
