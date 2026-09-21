package com.junglegym.recovery;

import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class VerificationEmailSender {
    private final JavaMailSender mailSender;
    private final String from;

    public VerificationEmailSender(JavaMailSender mailSender, @Value("${app.mail-from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public void send(String email, String code) throws MessagingException {
        var message = mailSender.createMimeMessage();
        var helper = new MimeMessageHelper(message, "UTF-8");
        helper.setFrom(from);
        helper.setTo(email);
        helper.setSubject("[JungleGym] 이메일 인증번호");
        helper.setText(template(code), true);
        mailSender.send(message);
    }

    private String template(String code) {
        try (var stream = new ClassPathResource("templates/email-verification.html").getInputStream()) {
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8)
                    .replace("{{VERIFICATION_CODE}}", code);
        } catch (IOException exception) {
            throw new IllegalStateException("인증 메일 템플릿을 읽지 못했습니다.", exception);
        }
    }
}
