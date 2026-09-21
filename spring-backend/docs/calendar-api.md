# 달력 API

로그인한 사용자 본인의 월별 출석을 조회한다. 두 API 모두 GET이며 기존 인증 쿠키를 사용한다.
성공 응답은 HTTP 200의 **JSON 배열 자체**이며 `success`, `data`로 감싸지 않는다.

| API | 경로 | 반환 항목 |
| --- | --- | --- |
| 전체 일자 | `/api/dashboard/calendar?year=2026&month=9` | `date`, `ischeck`, `title`, `img_url` |
| 출석 일자 | `/api/dashboard/calendar/attendance?year=2026&month=9` | `date`, `title`, `img_url` |

## 요청

- `year`: 필수 정수, 1~9999.
- `month`: 필수 정수, 1~12.
- 사용자 ID는 받지 않으며 로그인 정보에서 결정한다.
- 과거·미래 월 모두 조회 가능하다. 페이지 구분은 없다.

## 응답 규칙

- `date`는 해당 월의 일자(1~31)이며 오름차순, 날짜당 한 객체다.
- 전체 일자 API는 해당 월의 28~31일을 모두 반환한다. 인접 월의 달력 여백은 포함하지 않는다.
- `ischeck`는 boolean이다. 한국 시간(`Asia/Seoul`) 기준 입실 기록이 있으면 `true`다.
- 입실 중이거나 운동 기록 없이 퇴실했어도 출석에 포함한다.
- 자정이나 월 경계를 넘겨 퇴실해도 입실한 날짜에 귀속한다.
- `title`, `img_url`은 항상 문자열이며 없으면 `""`다. `null`을 반환하지 않는다.
- 하루에 여러 번 방문했다면 제목 또는 사진이 있는 방문 중 입실 시각이 가장 최근인 것을 사용한다.
  입실 시각이 같으면 방문 ID가 큰 것을 사용한다. 제목·사진은 같은 방문에서 가져오고,
  이후 빈 기록이나 재입실이 기존 운동 기록을 지우지 않는다. 모든 방문에 기록이 없으면 둘 다 `""`다.
- 출석 일자 API는 전체 일자의 `ischeck: true` 항목에서 `ischeck`를 제거한 배열과 같다.
  출석이 없는 월은 `[]`를 반환한다. 두 요청 사이에 입퇴실이 발생하면 조회 시점에 따라 달라질 수 있다.

전체 일자 응답의 항목 예시(실제 응답은 월의 마지막 날까지 포함):

```json
[
  { "date": 1, "ischeck": false, "title": "", "img_url": "" },
  { "date": 2, "ischeck": true, "title": "하체 운동", "img_url": "https://example.com/photo.jpg" },
  { "date": 3, "ischeck": true, "title": "", "img_url": "" }
]
```

위와 같은 출석 상황의 출석 일자 응답:

```json
[
  { "date": 2, "title": "하체 운동", "img_url": "https://example.com/photo.jpg" },
  { "date": 3, "title": "", "img_url": "" }
]
```

## 오류

오류는 기존 공통 JSON 객체 형식을 유지한다(`success: false`, `code`, `message`, `fieldErrors`, `timestamp`).

| HTTP 상태 | code | 원인 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | 연도·월 누락, 정수가 아닌 값, 허용 범위 초과 |
| 401 | `UNAUTHORIZED` | 인증 실패 |

## 프론트 연동 참고

이번 변경 범위는 Spring 백엔드다. Next API 전달 계층의 경로 허용 목록에 두 경로를 추가하고,
기존 `{ success, data }` 파서 대신 배열 응답을 처리해야 한다. 조회 캐시에는 연도·월을 포함하고
입퇴실 후 갱신해야 한다. 기존 `GET /api/dashboard`의 응답 계약은 유지한다.
