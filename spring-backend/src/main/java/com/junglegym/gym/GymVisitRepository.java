package com.junglegym.gym;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GymVisitRepository extends JpaRepository<GymVisit, Long> {
    // One conditional update makes concurrent scheduler runs idempotent and never
    // overwrites a checkout that has already completed (including its workout).
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update GymVisit v set v.checkedOutAt = :closedAt, v.activeUserId = null, "
            + "v.autoCheckedOut = true where v.checkedOutAt is null "
            + "and v.checkedInAt < :dayBoundary and v.checkedInAt <= :graceBoundary")
    int closeExpiredVisits(@Param("closedAt") Instant closedAt,
                           @Param("dayBoundary") Instant dayBoundary,
                           @Param("graceBoundary") Instant graceBoundary);

    boolean existsByUserIdAndCheckedOutAtIsNull(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<GymVisit> findFirstByUserIdAndCheckedOutAtIsNullOrderByCheckedInAtDesc(Long userId);
    Optional<GymVisit> findFirstByUserIdOrderByCheckedInAtDesc(Long userId);
    List<GymVisit> findAllByUserIdOrderByCheckedInAtDesc(Long userId);
    Page<GymVisit> findAllByUserId(Long userId, Pageable pageable);
    List<GymVisit> findAllByUserIdAndCheckedInAtBetweenOrderByCheckedInAtAsc(Long userId, Instant from, Instant to);
    @org.springframework.data.jpa.repository.Query("select v from GymVisit v where v.user.id = :userId "
            + "and v.checkedInAt >= :from and v.checkedInAt < :to order by v.checkedInAt asc, v.id asc")
    List<GymVisit> findCalendarVisits(@org.springframework.data.repository.query.Param("userId") Long userId,
                                    @org.springframework.data.repository.query.Param("from") Instant from,
                                    @org.springframework.data.repository.query.Param("to") Instant to);
    @org.springframework.data.jpa.repository.Query("select count(distinct v.user.id) from GymVisit v where v.checkedInAt >= :from and v.checkedInAt < :to")
    long countVisitorsBetween(@org.springframework.data.repository.query.Param("from") Instant from,
                              @org.springframework.data.repository.query.Param("to") Instant to);
    long countByCheckedOutAtIsNull();
}
