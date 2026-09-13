package com.junglegym.gym;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GymVisitRepository extends JpaRepository<GymVisit, Long> {
    boolean existsByUserIdAndCheckedOutAtIsNull(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<GymVisit> findFirstByUserIdAndCheckedOutAtIsNullOrderByCheckedInAtDesc(Long userId);
    Optional<GymVisit> findFirstByUserIdOrderByCheckedInAtDesc(Long userId);
    List<GymVisit> findAllByUserIdOrderByCheckedInAtDesc(Long userId);
    Page<GymVisit> findAllByUserId(Long userId, Pageable pageable);
    List<GymVisit> findAllByUserIdAndCheckedInAtBetweenOrderByCheckedInAtAsc(Long userId, Instant from, Instant to);
    @org.springframework.data.jpa.repository.Query("select count(distinct v.user.id) from GymVisit v where v.checkedInAt >= :from and v.checkedInAt < :to")
    long countVisitorsBetween(@org.springframework.data.repository.query.Param("from") Instant from,
                              @org.springframework.data.repository.query.Param("to") Instant to);
    long countByCheckedOutAtIsNull();
}
