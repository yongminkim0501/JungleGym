package com.junglegym.admin;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminAuditRepository extends JpaRepository<AdminAuditEvent, Long> {}
