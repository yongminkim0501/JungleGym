package com.junglegym.gym;

import com.junglegym.common.BusinessException;
import com.junglegym.user.User;
import com.junglegym.images.ImageStorage;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.junglegym.user.UserRepository;

@Service
public class GymService {
    private final GymVisitRepository visits;
    private final UserRepository users;
    private final ImageStorage images;

    public GymService(GymVisitRepository visits, UserRepository users, ImageStorage images) {
        this.visits = visits; this.users = users; this.images = images;
    }

    @Transactional
    public GymDtos.VisitResponse checkIn(Long userId) {
        User lockedUser = users.findLockedById(userId)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
        if (visits.existsByUserIdAndCheckedOutAtIsNull(userId))
            throw new BusinessException("ALREADY_CHECKED_IN", "이미 입실한 상태입니다.", HttpStatus.CONFLICT);
        return GymDtos.VisitResponse.from(visits.saveAndFlush(new GymVisit(lockedUser)));
    }

    @Transactional
    public GymDtos.VisitResponse checkOut(Long userId, GymDtos.CheckOutRequest request) {
        GymVisit visit = visits.findFirstByUserIdAndCheckedOutAtIsNullOrderByCheckedInAtDesc(userId)
                .orElseThrow(() -> new BusinessException("NOT_CHECKED_IN", "입실 기록이 없습니다.", HttpStatus.CONFLICT));
        visit.checkOut(request.title(), images.save(request.image()));
        return GymDtos.VisitResponse.from(visit);
    }
}
