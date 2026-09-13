package com.junglegym.recovery;

import com.junglegym.common.BusinessException;
import com.junglegym.user.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.http.HttpStatus;
import jakarta.mail.MessagingException;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.UUID;
import java.util.HexFormat;
import java.util.List;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Service
public class EmailVerificationService {
    private static final Duration CODE_TTL = Duration.ofMinutes(5);
    private static final Duration RESEND_COOLDOWN = Duration.ofMinutes(1);
    private static final Duration TICKET_TTL = Duration.ofMinutes(10);
    private static final int MAX_ATTEMPTS = 5;
    private static final DefaultRedisScript<Long> VERIFY_SCRIPT = new DefaultRedisScript<>("""
            local state = redis.call('GET', KEYS[1])
            if not state then return -1 end
            local separator = string.find(state, ':')
            local expected = string.sub(state, 1, separator - 1)
            local attempts = tonumber(string.sub(state, separator + 1))
            if attempts >= tonumber(ARGV[2]) then redis.call('DEL', KEYS[1]); return -2 end
            if expected ~= ARGV[1] then
              attempts = attempts + 1
              if attempts >= tonumber(ARGV[2]) then redis.call('DEL', KEYS[1])
              else
                local ttl = redis.call('PTTL', KEYS[1])
                redis.call('SET', KEYS[1], expected .. ':' .. attempts, 'PX', ttl)
              end
              return -3
            end
            redis.call('DEL', KEYS[1])
            redis.call('SET', KEYS[2], ARGV[3], 'EX', ARGV[4])
            return 1
            """, Long.class);
    private final StringRedisTemplate redis;
    private final VerificationEmailSender mailSender;
    private final UserRepository users;
    private final SecureRandom random = new SecureRandom();
    private final byte[] hmacSecret;

    public EmailVerificationService(StringRedisTemplate redis, VerificationEmailSender mailSender, UserRepository users,
                                    @Value("${app.verification-hmac-secret}") String hmacSecret) {
        this.redis = redis; this.mailSender = mailSender; this.users = users;
        this.hmacSecret = hmacSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    public void sendCode(String rawEmail, VerificationPurpose purpose) {
        String email = normalize(rawEmail);
        String cooldownKey = "email-verification:cooldown:" + purpose + ":" + email;
        Boolean allowed = redis.opsForValue().setIfAbsent(cooldownKey, "1", RESEND_COOLDOWN);
        if (!Boolean.TRUE.equals(allowed))
            throw new BusinessException("TOO_MANY_REQUESTS", "잠시 후 인증코드를 다시 요청해주세요.", HttpStatus.TOO_MANY_REQUESTS);
        if (!eligible(email, purpose)) return;
        String code = "%06d".formatted(random.nextInt(1_000_000));
        redis.opsForValue().set(codeKey(email, purpose), codeHash(email, purpose, code) + ":0", CODE_TTL);
        try {
            mailSender.send(email, code);
        } catch (MessagingException | RuntimeException exception) {
            redis.delete(cooldownKey); redis.delete(codeKey(email, purpose));
            throw new BusinessException("MAIL_SEND_FAILED", "인증 메일을 전송하지 못했습니다.", HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    public RecoveryDtos.VerifyCodeResponse verify(String rawEmail, String code, VerificationPurpose purpose) {
        String email = normalize(rawEmail); String ticket = UUID.randomUUID().toString();
        Long result = redis.execute(VERIFY_SCRIPT,
                List.of(codeKey(email, purpose), ticketKey(ticket, purpose)),
                codeHash(email, purpose, code), Integer.toString(MAX_ATTEMPTS), email,
                Long.toString(TICKET_TTL.toSeconds()));
        if (result == null || result == -1) throw invalidCode("인증코드가 만료되었거나 존재하지 않습니다.");
        if (result == -2) throw invalidCode("인증 시도 횟수를 초과했습니다.");
        if (result != 1) throw invalidCode("인증코드가 올바르지 않습니다.");
        User user = users.findByEmail(email).orElse(null);
        return new RecoveryDtos.VerifyCodeResponse(ticket, email, user == null ? null : user.getName());
    }

    public String consumeTicket(String ticket, VerificationPurpose purpose) {
        String key = ticketKey(ticket, purpose);
        String email = redis.opsForValue().getAndDelete(key);
        if (email == null) throw new BusinessException("INVALID_VERIFICATION_TICKET", "인증 정보가 만료되었습니다.", HttpStatus.BAD_REQUEST);
        return email;
    }

    private boolean eligible(String email, VerificationPurpose purpose) {
        boolean exists = users.existsByEmail(email);
        return purpose == VerificationPurpose.SIGN_UP ? !exists : exists;
    }
    private static String normalize(String email) { return email.trim().toLowerCase(); }
    private static String codeKey(String email, VerificationPurpose purpose) { return "email-verification:code:" + purpose + ":" + email; }
    private static String ticketKey(String ticket, VerificationPurpose purpose) { return "email-verification:ticket:" + purpose + ":" + ticket; }
    private static BusinessException invalidCode(String message) { return new BusinessException("INVALID_VERIFICATION_CODE", message, HttpStatus.BAD_REQUEST); }
    private String codeHash(String email, VerificationPurpose purpose, String code) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(hmacSecret, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal((purpose + ":" + email + ":" + code)
                    .getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (java.security.GeneralSecurityException exception) {
            throw new IllegalStateException("HMAC 초기화에 실패했습니다.", exception);
        }
    }
}
