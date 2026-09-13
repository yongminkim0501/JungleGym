package com.junglegym.gym;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class GymHistoryService {
    private final GymVisitRepository visits;

    public GymHistoryService(GymVisitRepository visits) {
        this.visits = visits;
    }

    public GymDtos.HistoryResponse history(Long userId, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, 100));
        var result = visits.findAllByUserId(userId, PageRequest.of(Math.max(page, 0), safeSize,
                Sort.by(Sort.Direction.DESC, "checkedInAt")));
        var content = result.getContent().stream().map(GymDtos.VisitResponse::from).toList();
        return new GymDtos.HistoryResponse(content, result.getNumber(),
                result.getTotalPages(), result.getTotalElements());
    }
}
