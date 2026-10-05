package com.junglegym.gym;

import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration(proxyBeanMethods = false)
@EnableScheduling
@ConditionalOnProperty(name = "app.gym.auto-checkout.enabled", havingValue = "true", matchIfMissing = true)
public class AutoCheckoutScheduler {
    private static final Logger log = LoggerFactory.getLogger(AutoCheckoutScheduler.class);
    private final AutoCheckoutService service;

    public AutoCheckoutScheduler(AutoCheckoutService service) { this.service = service; }

    // Check every minute to handle grace periods and missed runs after downtime.
    @Scheduled(cron = "0 * * * * *", zone = "Asia/Seoul")
    public void closeExpiredVisits() {
        int count = service.closeExpiredVisits(Instant.now());
        if (count > 0) log.info("Automatically checked out {} visits; recorded duration is 59 minutes", count);
    }
}
