# Jungle GYM Frontend

기존 Jungle GYM 화면을 Next.js App Router, React, TypeScript, Tailwind CSS로 이전한 독립 프론트엔드입니다. 서버 데이터는 TanStack Query, 임시 화면 상태는 Zustand, 폼은 React Hook Form과 Zod로 관리합니다.

## 실행

Node.js 22 이상과 npm이 필요합니다. 이 디렉터리에서 실행합니다.

```sh
npm ci
cp .env.example .env.local
```

`.env.local`의 `SPRING_API_ORIGIN`에 실제 Spring 서버의 origin을 입력합니다. 값은 프로토콜·호스트·선택적 포트로 구성하며 경로, 쿼리, 계정 정보를 포함하지 않습니다. 브라우저에 공개되는 환경 변수는 사용하지 않습니다.

```sh
npm run dev
```

기본 주소는 `http://localhost:3000`입니다. 서버 주소가 없거나 잘못되면 API 요청은 503 연결 오류를 반환합니다. 백엔드 주소를 임의로 추정하지 않습니다.

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

빌드에는 실행 중인 백엔드가 필요하지 않습니다. 배포 시 Node 서버가 필요하며 정적 파일만으로 배포하는 구성은 지원하지 않습니다. `output: standalone`을 직접 배포한다면 `.next/standalone`과 함께 `public`, `.next/static`을 동일한 Next 실행 경로에 배치해야 합니다.

## 구조

```text
src/
  app/         경로, 전역 Provider, 화면 연결, API 전달 Route Handler
  screens/     페이지를 구성하는 기능 조합
  features/    인증, 계정 복구, 대시보드, 입퇴실, 마이페이지, 메뉴
  entities/    사용자, 대시보드, 방문 기록 조회
  shared/      공통 UI, API 계약/통신, 알림, 조회 경계, 유틸리티
public/image/  기존 이미지·로고 자산
```

의존성 방향은 `app → screens → features → entities → shared`입니다. 각 기능의 외부 진입점은 `index.ts`이며, 다른 기능의 내부 파일을 직접 참조하지 않습니다. `shared/api/server`는 서버 전용 진입점입니다. Next 규약 파일과 정적 자산은 일반 소스 모듈 barrel 규칙에서 제외합니다.

`npm run lint`에는 계층 방향, 외부의 내부 파일 참조, 기능 간 직접 참조, 순환 의존성과 `index.ts` 누락 검사가 포함됩니다. TypeScript는 `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`를 사용합니다.

## 페이지와 데이터

| 경로 | 기능 |
| --- | --- |
| `/` | 운동 대시보드 |
| `/login`, `/register` | 로그인, 회원가입 |
| `/find-id`, `/find-password` | 계정 찾기, 비밀번호 재설정 |
| `/qr` | 입퇴실 |
| `/qr/success`, `/qr/error` | 입퇴실 결과 |
| `/mypage/info`, `/mypage/history` | 읽기 전용 프로필, 방문 기록 |

`/gym`은 `/qr`, `/mypage`는 `/mypage/info`로 이동합니다. 일반적인 미등록 화면 주소는 `/`로 이동하며, 미등록 API 경로는 오류를 반환합니다. `/health`는 프론트엔드 프로세스 응답만 확인하며 Spring 연결 상태를 의미하지 않습니다.

공개 화면은 인증 관련 4개 경로입니다. 나머지 화면은 `/api/auth/me`로 세션을 확인한 후 표시합니다. 로그인 실패와 공개 화면의 비로그인 상태를 보호 화면의 세션 만료와 구분합니다.

API가 필요한 화면은 브라우저에서 조회하며 `useSuspenseQuery`와 React Suspense의 스켈레톤을 사용합니다. 최초 조회, 빈 데이터, 조회 오류를 구분하고 재조회 중에는 캐시된 화면을 유지합니다. 주기적 polling은 하지 않습니다. 입퇴실 성공 후 관련 조회를 무효화합니다.

## 백엔드 계약

계약 기준은 [정글짐 백엔드 엔드포인트 구조](https://app.notion.com/p/3dac1fef77fe80b4bdc3d3250ca808cf?source=copy_link)와 [월별 출석 달력 API 명세](https://app.notion.com/p/3e1c1fef77fe80a9b01ad57fd69f1a5f?source=copy_link)의 2026-09-22 확인 내용입니다. 기존 Flask API 계약을 혼용하지 않습니다.

| 메서드 | 경로 | 요청 본문 |
| --- | --- | --- |
| GET | `/api/auth/csrf` | 없음 |
| GET | `/api/auth/me` | 없음 |
| POST | `/api/auth/register` | email, jungleNumber, nickname, name, password |
| POST | `/api/auth/login` | email, password |
| POST | `/api/auth/logout` | 없음 |
| POST | `/api/recovery/send-code` | email, purpose |
| POST | `/api/recovery/verify-code` | email, code, purpose |
| POST | `/api/recovery/reset-password` | ticket, password |
| POST | `/api/gym/check-in` | 없음 |
| POST | `/api/gym/check-out` | 선택적 title, image |
| GET | `/api/gym/visits` | page, size 쿼리 |
| GET | `/api/dashboard` | 없음 |
| GET | `/api/dashboard/calendar` | year, month 쿼리 |
| GET | `/api/dashboard/calendar/attendance` | year, month 쿼리 |

기존 성공 응답은 `{ success: true, data: T }`입니다. 월별 출석 달력 두 API만 성공 시 래퍼 없는 JSON 배열을 사용합니다. 회원가입은 201, 나머지는 200이며 값이 없는 성공도 `data: null`을 유지합니다. 요청·응답 타입은 Zod 스키마에서 도출합니다. 화면용 모델은 wire DTO와 구분하며 비밀번호 확인, 표시 행 같은 값을 API에 전송하지 않습니다.

브라우저는 동일 출처의 `/api/*`만 호출하고 Next 전달 계층은 허용된 경로·메서드만 Spring에 전달합니다. 요청 JSON과 응답 데이터는 변경하지 않습니다. 여러 `Set-Cookie` 헤더와 쿠키 만료·삭제 속성을 보존합니다. JWT를 JavaScript 저장소에 넣거나 프론트에서 생성·해독하지 않습니다.

모든 POST 전에 CSRF를 조회하고 응답 `data`를 `X-XSRF-TOKEN`에 보냅니다. `XSRF-TOKEN` 쿠키에서 읽은 값을 헤더로 대신 사용하지 않습니다. 동시에 진행 중인 CSRF 조회만 공유하며 POST는 자동 재시도하지 않습니다. 토큰 갱신 엔드포인트를 별도로 만들지 않습니다.

- 코드 재전송 60초, 인증 코드 300초, 비밀번호 변경 티켓 600초입니다. 코드는 앞자리 0을 보존하는 문자열입니다. 서버 오류가 최종 판단 기준입니다.
- 티켓과 복구 단계는 메모리에만 보관하고 흐름 종료 시 초기화합니다. 코드 요청 성공은 실제 메일 전달의 보장으로 표시하지 않습니다.
- 이미지 원본 10MiB, Data URL 14,000,000자, 전달 요청 15MiB, 운동 제목 100자 제한을 적용합니다. 퇴실 실패 시 기록을 보존합니다.
- 방문 기록은 100개 단위로 전체 페이지를 읽고 서버의 최신 방문 순서를 유지합니다. 날짜와 달력은 한국 시간 기준입니다.
- 현재 월 달력은 전체 일자 API를 사용하고, 최근 연속 출석은 오늘 또는 어제부터 출석이 끊길 때까지 출석 일자 API로 이전 월을 이어 계산합니다.
- 프로필 수정, 프로필 사진 변경, 명세에 없는 별도 refresh API는 구현하지 않습니다.

## 공통 UI와 모션

기존 초록색, 중립 색상, 폼·카드의 배치와 자산을 유지합니다. 공통 버튼·입력·Dialog·Sheet·알림을 통해 크기, 상태, 접근성을 관리합니다.

[Emil Kowalski의 디자인 엔지니어링 스킬](https://github.com/emilkowalski/skills)과 [Sonner](https://sonner.emilkowal.ski/)를 참고했습니다. 페이지·목록의 장식적 등장 효과는 두지 않습니다. 모달·시트·알림에 필요한 짧은 전환만 적용하고, 키보드 사용·모션 감소 설정을 반영합니다. 일반 상태 전환은 전역 CSS, 모달·시트의 중단 가능한 전환은 공통 `useMotionPresence`에서 관리합니다.

Sonner는 루트에 한 번만 마운트합니다. 기능 코드는 `shared/notifications`의 `notify`를 사용합니다. 필드 오류는 입력 근처, 조회 오류는 조회 영역에 표시하며 원시 HTML이나 인증 값을 toast에 노출하지 않습니다.

## 검증 범위

타입 검사·린트·빌드는 제품에서 직접 실행할 수 있습니다. API 시나리오를 위한 Mock, fixture, 브라우저 QA 도구와 결과는 저장소 밖의 로컬 환경에서 관리하며 제품 패키지와 배포에 포함하지 않습니다.

실제 Spring 서버, 이메일 전달, 이미지 저장 서비스, 운영 쿠키·TLS·네트워크 구성은 아직 검증하지 않았습니다. 실제 백엔드가 준비되면 동일한 API 계약으로 별도 연동 QA가 필요합니다. 기존 저장소 루트의 Flask 실행 절차 대신 이 디렉터리의 Next 실행 절차를 사용합니다.
