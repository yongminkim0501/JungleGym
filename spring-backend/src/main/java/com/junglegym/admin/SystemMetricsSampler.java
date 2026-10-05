package com.junglegym.admin;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration(proxyBeanMethods = false)
@EnableScheduling
@ConditionalOnProperty(name = "app.admin.metrics.history-enabled", havingValue = "true", matchIfMissing = true)
public class SystemMetricsSampler {
    private final SystemMetricsService metrics;

    public SystemMetricsSampler(SystemMetricsService metrics) { this.metrics = metrics; }

    @Scheduled(cron = "0 * * * * *")
    public void sample() { metrics.sample(); }
}
