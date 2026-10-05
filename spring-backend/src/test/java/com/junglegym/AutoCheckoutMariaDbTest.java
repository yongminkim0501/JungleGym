package com.junglegym;

import com.junglegym.common.BusinessException;
import com.junglegym.gym.*;
import com.junglegym.user.*;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.MariaDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = "spring.profiles.active=mariadb")
@Testcontainers(disabledWithoutDocker = true)
class AutoCheckoutMariaDbTest {
    @Container static final MariaDBContainer<?> maria = new MariaDBContainer<>("mariadb:11.8");
    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", maria::getJdbcUrl);
        registry.add("spring.datasource.username", maria::getUsername);
        registry.add("spring.datasource.password", maria::getPassword);
    }
    @Autowired AutoCheckoutService autoCheckout;
    @Autowired GymService gym;
    @Autowired GymVisitRepository visits;
    @Autowired UserRepository users;
    @Autowired PlatformTransactionManager transactionManager;
    private User user;
    private Long visitId;
    // 2026-10-01 04:00 KST
    private static final Instant NOW = Instant.parse("2026-09-30T19:00:00Z");

    @BeforeEach
    void setUp() {
        visits.deleteAll();
        String unique = UUID.randomUUID().toString();
        user = users.saveAndFlush(new User(unique + "@example.com", unique, unique.substring(0, 20), "DB 검증", "unused"));
        var visit = new GymVisit(user);
        ReflectionTestUtils.setField(visit, "checkedInAt", Instant.parse("2026-09-30T02:30:00Z"));
        visitId = visits.saveAndFlush(visit).getId();
    }

    @Test
    void twoSchedulersCloseOnlyOnceAndReleaseUniqueActiveVisit() throws Exception {
        var start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Callable<Integer> task = () -> { assertTrue(start.await(5, TimeUnit.SECONDS)); return autoCheckout.closeExpiredVisits(NOW); };
            var first = executor.submit(task);
            var second = executor.submit(task);
            start.countDown();
            assertEquals(1, first.get(10, TimeUnit.SECONDS) + second.get(10, TimeUnit.SECONDS));
        }
        var saved = visits.findById(visitId).orElseThrow();
        assertTrue(saved.isAutoCheckedOut());
        assertEquals(59L, saved.getDurationMinutes());
        assertNotEquals(visitId, gym.checkIn(user.getId()).id());
    }

    @Test
    void manualCheckoutHoldingRowLockIsNotOverwrittenByScheduler() throws Exception {
        var locked = new CountDownLatch(1);
        var scheduled = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var manual = executor.submit(() -> new TransactionTemplate(transactionManager).execute(status -> {
                var visit = visits.findFirstByUserIdAndCheckedOutAtIsNullOrderByCheckedInAtDesc(user.getId()).orElseThrow();
                locked.countDown();
                await(scheduled);
                visit.checkOut("직접 저장한 운동", "https://example.com/manual.jpg");
                ReflectionTestUtils.setField(visit, "checkedOutAt", visit.getCheckedInAt().plusSeconds(80 * 60));
                return visit.getId();
            }));
            assertTrue(locked.await(5, TimeUnit.SECONDS));
            var automatic = executor.submit(() -> { scheduled.countDown(); return autoCheckout.closeExpiredVisits(NOW); });
            assertEquals(visitId, manual.get(10, TimeUnit.SECONDS));
            assertEquals(0, automatic.get(10, TimeUnit.SECONDS));
        }
        var saved = visits.findById(visitId).orElseThrow();
        assertFalse(saved.isAutoCheckedOut());
        assertEquals(80L, saved.getDurationMinutes());
        assertEquals("직접 저장한 운동", saved.getWorkoutTitle());
    }

    @Test
    void automaticCheckoutFirstMakesLateManualCheckoutConflict() throws Exception {
        var locked = new CountDownLatch(1);
        var manualStarted = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var automatic = executor.submit(() -> new TransactionTemplate(transactionManager).execute(status -> {
                int count = autoCheckout.closeExpiredVisits(NOW);
                locked.countDown();
                await(manualStarted);
                return count;
            }));
            assertTrue(locked.await(5, TimeUnit.SECONDS));
            var manual = executor.submit(() -> {
                manualStarted.countDown();
                return assertThrows(BusinessException.class, () -> gym.checkOut(user.getId(), new GymDtos.CheckOutRequest("늦은 요청", null)));
            });
            assertEquals(1, automatic.get(10, TimeUnit.SECONDS));
            assertEquals("NOT_CHECKED_IN", manual.get(10, TimeUnit.SECONDS).getCode());
        }
        assertEquals(59L, visits.findById(visitId).orElseThrow().getDurationMinutes());
    }

    private static void await(CountDownLatch latch) {
        try { assertTrue(latch.await(5, TimeUnit.SECONDS)); }
        catch (InterruptedException exception) { Thread.currentThread().interrupt(); throw new IllegalStateException(exception); }
    }
}
