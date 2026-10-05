package com.junglegym.admin;

import com.junglegym.common.BusinessException;
import com.junglegym.gym.GymVisitRepository;
import com.junglegym.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;

@Service
public class AdminService {
    private final UserRepository users;
    private final GymVisitRepository visits;
    private final AdminAuditRepository audit;
    public AdminService(UserRepository users, GymVisitRepository visits, AdminAuditRepository audit) {
        this.users = users; this.visits = visits; this.audit = audit;
    }

    @Transactional(readOnly = true)
    public AdminDtos.Data data() {
        var members = users.findAll().stream().map(AdminDtos.Member::from).toList();
        var events = new ArrayList<AdminDtos.Activity>();
        for (var user : members) events.add(new AdminDtos.Activity("register-" + user.id(), user.id(),
                "register", user.joinedAt(), "success", "회원가입", "user", "사용자"));
        for (var visit : visits.findAll()) {
            String userId = visit.memberId().toString();
            events.add(new AdminDtos.Activity("checkin-" + visit.getId(), userId, "checkin", visit.getCheckedInAt(),
                    "success", "입실", "user", "사용자"));
            if (visit.getCheckedOutAt() != null) events.add(new AdminDtos.Activity("checkout-" + visit.getId(), userId,
                    "checkout", visit.getCheckedOutAt(), "success", visit.isAutoCheckedOut() ? "자동 퇴실 · 59분" : "퇴실",
                    visit.isAutoCheckedOut() ? "system" : "user", visit.isAutoCheckedOut() ? "시스템" : "사용자"));
        }
        for (var event : audit.findAll()) events.add(new AdminDtos.Activity("admin-" + event.getId(),
                event.getUserId().toString(), event.getEventType(), event.getCreatedAt(), "success", event.getDetail(),
                "admin", "관리자 " + event.getAdminId()));
        events.sort(Comparator.comparing(AdminDtos.Activity::at).reversed().thenComparing(AdminDtos.Activity::id));
        return new AdminDtos.Data(1, Instant.now(), members, events);
    }

    @Transactional
    public AdminDtos.Member update(Long id, AdminDtos.UpdateMember input, AdminSessionService.Principal admin) {
        var user = users.findLockedById(id).orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "회원을 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        if (user.getAdminRevision() != input.revision())
            throw new BusinessException("STALE_MEMBER", "다른 관리자가 수정한 회원입니다. 새로고침 후 다시 확인해 주세요.", HttpStatus.CONFLICT);
        boolean suspended = input.status().equals("suspended");
        boolean statusChanged = user.isSuspended() != suspended;
        if (statusChanged && input.note().isBlank())
            throw new BusinessException("REASON_REQUIRED", "이용 상태 변경 사유를 관리 메모에 입력해 주세요.", HttpStatus.BAD_REQUEST);
        if (!user.getEmail().equals(input.email()) && users.existsByEmail(input.email()))
            throw new BusinessException("EMAIL_ALREADY_EXISTS", "이미 사용 중인 이메일입니다.", HttpStatus.CONFLICT);
        if (!user.getNickname().equals(input.nickname()) && users.existsByNickname(input.nickname()))
            throw new BusinessException("NICKNAME_ALREADY_EXISTS", "이미 사용 중인 닉네임입니다.", HttpStatus.CONFLICT);
        var changes = new ArrayList<String>();
        if (!user.getName().equals(input.name())) changes.add("이름: " + user.getName() + " → " + input.name());
        if (!user.getNickname().equals(input.nickname())) changes.add("닉네임: " + user.getNickname() + " → " + input.nickname());
        if (!user.getEmail().equals(input.email())) changes.add("이메일: " + user.getEmail() + " → " + input.email());
        if (!user.getAdminNote().equals(input.note())) changes.add("관리 메모: " + user.getAdminNote() + " → " + input.note());
        if (statusChanged) changes.add((suspended ? "이용 정지" : "이용 재개") + " · 사유: " + input.note());
        if (changes.isEmpty()) return AdminDtos.Member.from(user);
        user.updateByAdmin(input.name(), input.nickname(), input.email(), input.note(), suspended);
        users.flush();
        audit.save(new AdminAuditEvent(id, admin.id(), statusChanged ? (suspended ? "suspend" : "restore") : "update", String.join(" / ", changes)));
        return AdminDtos.Member.from(user);
    }
}
