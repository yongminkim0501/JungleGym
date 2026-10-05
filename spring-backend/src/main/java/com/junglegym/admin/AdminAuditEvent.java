package com.junglegym.admin;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "admin_audit_events")
public class AdminAuditEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(name = "admin_id", nullable = false) private int adminId;
    @Column(name = "event_type", nullable = false, length = 20) private String eventType;
    @Column(nullable = false, length = 4000) private String detail;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected AdminAuditEvent() {}
    public AdminAuditEvent(Long userId, int adminId, String type, String detail) {
        this.userId = userId; this.adminId = adminId; this.eventType = type;
        this.detail = detail; this.createdAt = Instant.now();
    }
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public int getAdminId() { return adminId; }
    public String getEventType() { return eventType; }
    public String getDetail() { return detail; }
    public Instant getCreatedAt() { return createdAt; }
}
