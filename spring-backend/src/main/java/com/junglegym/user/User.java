package com.junglegym.user;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true) private String email;
    // Nullable only for members registered before jungle numbers were introduced.
    @Column(name = "jungle_number", unique = true, length = 50) private String jungleNumber;
    @Column(nullable = false, unique = true, length = 25) private String nickname;
    @Column(nullable = false, length = 50) private String name;
    @Column(name = "password_hash", nullable = false) private String passwordHash;
    @Column(name = "profile_image_url", length = 2048) private String profileImageUrl;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(nullable = false) private boolean suspended;
    @Column(name = "admin_note", nullable = false, length = 500) private String adminNote = "";
    @Column(name = "admin_revision", nullable = false) private long adminRevision;
    @Column(name = "security_version", nullable = false) private long securityVersion;

    protected User() {}

    public User(String email, String jungleNumber, String nickname, String name, String passwordHash) {
        this.email = email.trim().toLowerCase();
        this.jungleNumber = jungleNumber;
        this.nickname = nickname.trim();
        this.name = name.trim();
        this.passwordHash = passwordHash;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getJungleNumber() { return jungleNumber; }
    public String getNickname() { return nickname; }
    public String getName() { return name; }
    public String getPasswordHash() { return passwordHash; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public void changePassword(String passwordHash) { this.passwordHash = passwordHash; }
    public Instant getCreatedAt() { return createdAt; }
    public boolean isSuspended() { return suspended; }
    public String getAdminNote() { return adminNote; }
    public long getAdminRevision() { return adminRevision; }
    public long getSecurityVersion() { return securityVersion; }
    public void updateByAdmin(String name, String nickname, String email, String note, boolean suspended) {
        if (this.suspended != suspended) securityVersion++;
        this.name = name;
        this.nickname = nickname;
        this.email = email;
        this.adminNote = note;
        this.suspended = suspended;
        adminRevision++;
    }
}
