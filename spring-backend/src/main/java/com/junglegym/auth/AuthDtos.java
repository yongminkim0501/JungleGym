package com.junglegym.auth;

import jakarta.validation.constraints.*;
import com.junglegym.user.User;
import com.junglegym.common.validation.MaxUtf8Bytes;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(max = 50) String jungleNumber,
            @NotBlank @Size(min = 4, max = 25) String nickname,
            @NotBlank @Size(max = 50) String name,
            @NotNull @Size(min = 8, max = 72) @MaxUtf8Bytes(72) String password
    ) {
        public RegisterRequest {
            if (jungleNumber != null) jungleNumber = jungleNumber.strip();
        }
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank @MaxUtf8Bytes(72) String password
    ) {}

    public record UserResponse(Long id, String email, String nickname, String name, String profileImageUrl) {
        public static UserResponse from(User user) {
            return new UserResponse(user.getId(), user.getEmail(), user.getNickname(), user.getName(),
                    user.getProfileImageUrl());
        }

        public static UserResponse from(AuthenticatedUser user) {
            return new UserResponse(user.id(), user.email(), user.nickname(), user.name(), user.profileImageUrl());
        }
    }
}
