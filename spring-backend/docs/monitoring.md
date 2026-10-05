# 모니터링

문제가 생겼을 때 **알아채기 → 언제·어디서 → 왜** 순서로 확인한다.

| 단계 | 수단 | 위치 |
| --- | --- | --- |
| 알아채기 | UptimeRobot 외부 가동 감시, 이메일 알림 | UptimeRobot 대시보드 |
| 언제·어디서 | 관리자 `시스템` 탭: 엔드포인트별 응답 시간·오류 수, 24시간 추이 | `/admin` → 시스템 |
| 왜 | 요청 ID가 붙은 Spring 로그, 예외 스택트레이스 | `docker logs <api 컨테이너>` |

## 외부 가동 감시 (UptimeRobot)

- 무료 플랜, 5분 간격 HTTP 검사, 장애·복구 시 이메일 알림.
- 2026-10-05 현재 감시 URL은 `https://junglegym.club/login`이다. 운영 도메인이 아직 `main`의 Flask 버전이라 Spring 헬스체크 경로가 없다. 이 URL은 서버·Nginx·앱 프로세스 중단만 감지하고 DB·Redis 장애는 감지하지 못한다.
- Spring 버전 배포 후 같은 모니터를 수정해 Spring `/actuator/health`로 바꾼다. 이 경로는 로그인 없이 열리며 DB·Redis·SMTP 중 하나라도 실패하면 503을 반환한다. EC2 직접 접근을 막는 경우 UptimeRobot 접근 경로(IP 허용 또는 프론트 헬스체크 연동)를 함께 정한다.
- 프론트 `/health`는 백엔드 상태와 무관하게 200이므로 감시 대상으로 쓰지 않는다.

## 관리자 시스템 탭

`GET /api/admin/metrics`를 30초마다 조회한다. Prometheus 없이 Spring Actuator(Micrometer)가 기록하는 `http.server.requests`를 읽으며, `/actuator/prometheus`·`/actuator/metrics`는 외부에 열지 않는다.

- 엔드포인트는 경로 템플릿(`/api/admin/users/{id}`) 단위로 묶는다. 컨트롤러에 도달하지 못한 요청(보안 거절·404)은 `UNKNOWN`으로 묶인다.
- 요청 수·평균은 서버 시작 이후 누적, p95·최대는 약 2분 이동 구간 값이다. 그 사이 요청이 없으면 비워 둔다. p95는 정상 응답 기준이며 정상 응답이 없을 때만 오류 응답 값을 쓴다.
- `SystemMetricsSampler`가 매분 직전 1분의 요청 수·4xx·5xx·평균 응답 시간·힙·DB 사용 연결을 Redis 리스트 `admin:metrics:history`에 추가하고 1,440개(24시간)만 남긴다. 서버가 멈춘 구간은 기록이 없어 차트의 선이 끊긴다.
- 재시작하면 누적 값은 0부터 다시 시작하고 24시간 추이는 Redis에 남는다. Redis에 디스크 저장(AOF/RDB)이 없으면 Redis 재시작 시 추이도 사라진다.
- 여러 Spring 인스턴스는 같은 리스트에 기록하므로 인스턴스 구분이 필요해진다. 현재는 단일 EC2 기준이다.
- `APP_ADMIN_METRICS_HISTORY_ENABLED=false`로 분 단위 기록을 끈다. 테스트는 꺼 두고 `sample()`을 직접 호출한다.

## 요청 ID와 오류 로그

- Next 프록시가 요청마다 새 UUID를 `X-Request-Id`로 Spring에 보낸다. 클라이언트가 보낸 값은 쓰지 않는다.
- `RequestIdFilter`는 형식(`[A-Za-z0-9-]{8,64}`)에 맞는 ID만 받고, 없거나 형식이 다르면 새로 발급한다. 같은 ID가 응답 헤더 `X-Request-Id`, 오류 응답의 `requestId`, 해당 요청의 모든 로그 줄(`ERROR [<id>]`)에 남는다.
- 로그 기준:
  - 처리되지 않은 예외: `ERROR`와 스택트레이스. 응답 본문에는 내부 정보를 넣지 않는다.
  - 5xx 응답, 1초 이상 걸린 요청: `WARN <method> <path> -> <status> in <ms>ms`. 쿼리 문자열은 인증 코드가 섞일 수 있어 남기지 않는다.
  - DB 무결성 충돌(409): 제약 조건 메시지를 `WARN`으로 남긴다.
- Spring에 연결하지 못하면 Next 프록시가 503과 요청 ID를 반환하고 `[proxy] ... Spring unreachable (requestId=...)`를 플랫폼 로그(Vercel)에 남긴다.
- 화면의 서버 오류 메시지에는 `(요청 ID: 앞 8자리)`가 붙는다. 제보받은 값으로 `docker logs <api 컨테이너> 2>&1 | grep <앞 8자리>`를 실행한다.

## 로그 보관

당분간 Docker 컨테이너 로그로만 유지한다. 컨테이너를 재시작하면 남지만 재생성(`up --build`, `down` 후 `up`)하면 이전 로그는 사라진다. 장기 보관이나 디스크 상한(`max-size`) 설정, CloudWatch Logs 전송은 필요해질 때 결정한다.
