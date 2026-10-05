# Spring 관리자

Next.js `/admin` 화면이 Spring `/api/admin/**`를 사용한다. 일반 회원 인증과 분리된 관리자 보안 체인을 사용하며 개발·프로덕션 모두 접근할 수 있다. 토큰 설정이 없으면 관리자 로그인이 비활성화된다.

## 실행

1. `spring-backend/.env.example`을 `.env.local`로 복사하고 값을 채운다. 각 비밀 값은 `openssl rand -hex 32` 등으로 별도 생성한다. 기존 관리자 토큰은 `ADMIN_TOKEN_1`, `ADMIN_TOKEN_2`로 이전할 수 있다.
2. 저장소 루트에서 `docker compose -p junglegym-spring-local --env-file spring-backend/.env.local -f docker-compose.spring.local.yml up -d --build`를 실행한다.
3. `frontend/.env.local`에 `SPRING_API_ORIGIN=http://127.0.0.1:18105`를 설정한다.
4. frontend에서 `npm run dev -- --hostname 127.0.0.1 --port 3100` 실행 후 `http://127.0.0.1:3100/admin` 접속.

Compose는 로컬 개발 전용이다. MariaDB와 Redis는 전용 볼륨에 보존하고 외부 포트를 열지 않는다. 메일은 Mailpit으로 대체하며 `http://127.0.0.1:18025`에서 확인한다. 중지는 같은 Compose 명령의 `down`을 사용한다. `down -v`는 DB와 세션 볼륨을 삭제하므로 사용하지 않는다.

운영에서는 기존 Vercel→EC2 구성에 맞춰 `SPRING_API_ORIGIN`, DB·Redis·SMTP, `FRONTEND_ORIGIN`, `COOKIE_SECURE=true`, JWT/HMAC 키와 관리자 토큰을 서버 환경에 주입한다. 로컬 Compose를 그대로 외부에 공개하지 않는다. Next.js 의존성 버전은 이번 변경에서 갱신하지 않았다.

## 인증

- 두 토큰은 서로 달라야 하고 각각 32~256자여야 한다. 관리자 1·2는 같은 권한이다.
- 토큰은 Spring에만 설정한다. 프론트 환경변수, 코드, localStorage에 저장하지 않는다.
- Spring이 토큰을 비교하고 무작위 256비트 세션을 발급한다. Redis에는 세션 ID의 SHA-256 해시를 키로 관리자 번호·토큰 지문을 8시간 저장한다.
- 브라우저 쿠키 `junglegym-admin-session`은 HttpOnly, SameSite=Strict, Path=/이다. Secure는 서버 쿠키 설정을 따른다.
- 서버 재시작·여러 Spring 인스턴스에서도 같은 Redis와 토큰 설정을 사용하면 세션이 유지된다. 로그아웃은 Redis 세션을 삭제한다. 토큰 변경 후 서버에 새 설정이 반영되면 이전 토큰의 세션은 무효화된다.
- 로그인 요청은 Redis 기준 전체 관리자 합계 분당 10회다. 일반 회원 JWT로 관리자 API에 접근할 수 없고, 관리자 쿠키로 회원 전용 API에 접근할 수도 없다.
- 쓰기 요청은 별도 CSRF 쿠키 `ADMIN-XSRF-TOKEN`과 `X-ADMIN-CSRF` 헤더를 사용한다. CSRF 조회 응답의 `data`를 헤더에 보낸다. 일반 회원용 XSRF 쿠키와 분리되어 있다.

## 엔드포인트

성공 응답은 `{ success: true, data: ... }`, 오류는 기존 공통 API 오류 형식을 따른다. Next.js 프록시도 아래 경로만 허용한다.

| 메서드 | 경로 | 동작 |
| --- | --- | --- |
| GET | `/api/admin/auth/csrf` | 관리자 쓰기 요청용 CSRF 토큰 |
| POST | `/api/admin/auth/login` | `{ token }` 검증, 쿠키 설정, `{ id, name }` 반환 |
| GET | `/api/admin/auth/me` | 현재 관리자 신원 확인 |
| POST | `/api/admin/auth/logout` | 세션 취소·쿠키 만료. 만료된 세션도 로그아웃 가능, CSRF 필수 |
| GET | `/api/admin/data` | 회원·가입·입퇴실 기록·관리자 감사 로그·조회 시각 |
| GET | `/api/admin/metrics` | 엔드포인트별 응답 시간·오류 수, JVM 힙, DB 연결 풀, 최근 24시간 분 단위 기록 |
| PATCH | `/api/admin/users/{id}` | 회원 정보·이용 상태·관리 메모 수정 |

회원 수정 본문:

```json
{
  "name": "회원 이름",
  "nickname": "nickname",
  "email": "member@example.com",
  "status": "active",
  "note": "변경 사유",
  "revision": 0
}
```

- status는 `active` 또는 `suspended`. 상태 변경에는 비어 있지 않은 note가 필요하다.
- 이름·닉네임·이메일 유효성 및 중복을 서버에서 검사한다. 정글 번호는 조회만 제공한다.
- 조회한 revision을 그대로 전송한다. 다른 관리자가 먼저 수정했다면 409 `STALE_MEMBER`로 거절한다. 새로고침해 최신 정보 확인 후 다시 수정한다.
- 회원 변경과 관리자 번호·시각·이전/이후 값의 감사 기록을 같은 DB 트랜잭션으로 저장한다. 실패·중복·변경 없는 요청에는 감사 기록을 만들지 않는다.
- 정지와 해제 시 `security_version`을 증가시킨다. 회원의 기존 access/refresh JWT는 정지 시 즉시 거절되고 해제 후에도 다시 사용할 수 없다. 해제된 회원은 새로 로그인해야 한다.

## 화면과 데이터 범위

화면은 예시 데이터와 localStorage를 사용하지 않는다. 서로 다른 브라우저도 같은 DB를 조회한다. 새로고침 버튼·창으로 다시 돌아올 때 최신 내용을 조회하며 주기적 polling은 하지 않는다(시스템 탭만 30초 주기 조회). 관리자 세션 만료 시 로그인 화면으로 이동한다.

전체 회원 수, 오늘·최근 7일 출석, 현재 입실, 정지 회원 수를 실제 데이터로 계산한다. 날짜는 한국 시간 기준이다. 가입·입퇴실은 실제 원본 기록에서 구성하고, 관리자 정보 수정·정지·해제는 영구 감사 테이블에서 조회한다. 일반 회원의 로그인 성공·실패 이력은 이번 구현에서 수집하지 않는다. 서버에 존재하지 않는 예시 로그는 표시하지 않는다.

현재 소규모 운영 화면은 `/data`로 전체 회원·입퇴실·감사 기록을 조회해 브라우저에서 검색·필터·정렬·페이지 이동·CSV 내보내기를 수행한다. 데이터량이 커지면 서버 검색·페이지네이션·CSV 스트리밍으로 확장해야 한다. 비밀번호 해시·인증 토큰은 관리자 응답에 포함하지 않는다.

Flyway V4는 기존 회원을 정상 상태, 빈 메모, revision/security_version=0으로 이전한다. 강제 퇴실·방문 기록 정정은 이번 API에 포함하지 않는다.

## 시스템 지표

관리자 화면의 `시스템` 탭이 `/api/admin/metrics`를 30초마다 조회한다. 수집 방식·보관 기간·요청 ID 로그는 [모니터링 문서](monitoring.md)를 참조한다.
