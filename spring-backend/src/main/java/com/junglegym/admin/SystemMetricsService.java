package com.junglegym.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.distribution.ValueAtPercentile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.concurrent.TimeUnit;

/** Reads the request timers Spring already records, so no separate metrics server is required. */
@Service
public class SystemMetricsService {
    static final String HISTORY_KEY = "admin:metrics:history";
    static final int HISTORY_SIZE = 24 * 60;
    private static final Logger log = LoggerFactory.getLogger(SystemMetricsService.class);
    private static final String REQUESTS = "http.server.requests";
    private final MeterRegistry registry;
    private final StringRedisTemplate redis;
    private final ObjectMapper json;
    private Totals previous;

    private record Totals(long requests, double totalMs, long clientErrors, long serverErrors) {}

    public SystemMetricsService(MeterRegistry registry, StringRedisTemplate redis, ObjectMapper json) {
        this.registry = registry; this.redis = redis; this.json = json;
    }

    public AdminDtos.Metrics current() {
        var runtime = Runtime.getRuntime();
        long startedAt = ManagementFactory.getRuntimeMXBean().getStartTime();
        return new AdminDtos.Metrics(Instant.now(), Instant.ofEpochMilli(startedAt),
                ManagementFactory.getRuntimeMXBean().getUptime() / 1000,
                new AdminDtos.Jvm(toMb(runtime.totalMemory() - runtime.freeMemory()), toMb(runtime.maxMemory())),
                new AdminDtos.Db(gauge("hikaricp.connections.active"), gauge("hikaricp.connections.idle"),
                        gauge("hikaricp.connections.pending"), gauge("hikaricp.connections.max")),
                endpoints(), history());
    }

    /** Appends the last minute's request delta; counters restart with the process, so a drop resets the baseline. */
    public synchronized void sample() {
        var totals = totals();
        var base = previous == null || totals.requests() < previous.requests() ? new Totals(0, 0, 0, 0) : previous;
        previous = totals;
        long requests = totals.requests() - base.requests();
        var runtime = Runtime.getRuntime();
        var point = new AdminDtos.MetricPoint(Instant.now(), requests,
                totals.clientErrors() - base.clientErrors(), totals.serverErrors() - base.serverErrors(),
                requests == 0 ? null : round((totals.totalMs() - base.totalMs()) / requests),
                toMb(runtime.totalMemory() - runtime.freeMemory()), gauge("hikaricp.connections.active"));
        try {
            redis.opsForList().rightPush(HISTORY_KEY, json.writeValueAsString(point));
            redis.opsForList().trim(HISTORY_KEY, -HISTORY_SIZE, -1);
        } catch (Exception e) {
            log.warn("Failed to store admin metrics sample", e);
        }
    }

    private List<AdminDtos.MetricPoint> history() {
        var raw = redis.opsForList().range(HISTORY_KEY, 0, -1);
        var points = new ArrayList<AdminDtos.MetricPoint>();
        if (raw != null) for (var value : raw) {
            try { points.add(json.readValue(value, AdminDtos.MetricPoint.class)); }
            catch (Exception e) { log.warn("Skipping malformed admin metrics sample"); }
        }
        return points;
    }

    private Totals totals() {
        long requests = 0, client = 0, server = 0; double total = 0;
        for (Timer timer : registry.find(REQUESTS).timers()) {
            long count = timer.count();
            requests += count; total += timer.totalTime(TimeUnit.MILLISECONDS);
            String status = timer.getId().getTag("status");
            if (status != null && status.startsWith("4")) client += count;
            if (status != null && status.startsWith("5")) server += count;
        }
        return new Totals(requests, total, client, server);
    }

    private List<AdminDtos.EndpointMetric> endpoints() {
        // One timer exists per status/outcome; merge them per route. Percentiles cannot be merged,
        // so p95 comes from successful responses, which is the latency users actually wait for.
        class Group {
            long count, client, server; double totalMs, maxMs; Double successP95, otherP95;
        }
        var groups = new LinkedHashMap<String, Group>();
        for (Timer timer : registry.find(REQUESTS).timers()) {
            var id = timer.getId();
            String method = id.getTag("method"), uri = id.getTag("uri"), status = id.getTag("status");
            var group = groups.computeIfAbsent(method + " " + uri, key -> new Group());
            var snapshot = timer.takeSnapshot();
            group.count += timer.count();
            group.totalMs += timer.totalTime(TimeUnit.MILLISECONDS);
            double recentMax = snapshot.max(TimeUnit.MILLISECONDS);
            group.maxMs = Math.max(group.maxMs, recentMax);
            if (status != null && status.startsWith("4")) group.client += timer.count();
            if (status != null && status.startsWith("5")) group.server += timer.count();
            boolean success = "SUCCESS".equals(id.getTag("outcome"));
            // The p95/max window decays after ~2 minutes; an idle timer reports 0, not a real latency.
            if (recentMax == 0) continue;
            for (ValueAtPercentile percentile : snapshot.percentileValues()) {
                if (percentile.percentile() != 0.95) continue;
                double value = percentile.value(TimeUnit.MILLISECONDS);
                if (success) group.successP95 = value;
                else group.otherP95 = group.otherP95 == null ? value : Math.max(group.otherP95, value);
            }
        }
        return groups.entrySet().stream().map(entry -> {
            var parts = entry.getKey().split(" ", 2);
            var group = entry.getValue();
            Double p95 = group.successP95 != null ? group.successP95 : group.otherP95;
            return new AdminDtos.EndpointMetric(parts[0], parts[1], group.count,
                    group.count == 0 ? null : round(group.totalMs / group.count),
                    p95 == null ? null : round(p95), group.maxMs == 0 ? null : round(group.maxMs),
                    group.client, group.server);
        }).sorted(Comparator.comparingLong(AdminDtos.EndpointMetric::count).reversed()
                .thenComparing(AdminDtos.EndpointMetric::uri)).toList();
    }

    private Integer gauge(String name) {
        var gauge = registry.find(name).gauge();
        return gauge == null || Double.isNaN(gauge.value()) ? null : (int) gauge.value();
    }

    private static long toMb(long bytes) { return bytes / (1024 * 1024); }
    private static double round(double value) { return Math.round(value * 10) / 10.0; }
}
