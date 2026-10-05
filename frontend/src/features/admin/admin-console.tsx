"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/shared/ui";
import { notify } from "@/shared/notifications";
import { Icon, type IconName } from "./icons";
import { MemberEditor } from "./member-editor";
import {
  dateKey,
  downloadCsv,
  eventLabels,
  formatDate,
  isInside,
  type AdminData,
  type Activity,
  type EventType,
  type Member,
} from "./model";
import styles from "./admin-console.module.css";

type View = "overview" | "users" | "logs";
type Status = "all" | "active" | "suspended" | "inside";
const views: { id: View; title: string; icon: IconName }[] = [
  { id: "overview", title: "운영 현황", icon: "overview" },
  { id: "users", title: "사용자 관리", icon: "users" },
  { id: "logs", title: "활동 로그", icon: "logs" },
];
const pageSize = 8;

function StatusBadge({ status }: { status: Member["status"] }) {
  return (
    <span
      className={`${styles.badge} ${status === "active" ? styles.good : styles.danger}`}
    >
      <i />
      {status === "active" ? "정상" : "이용 정지"}
    </span>
  );
}
function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className={styles.pagination}>
      <span>
        총 <strong>{total}</strong>건
        {total > 0
          ? ` 중 ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`
          : ""}
      </span>
      <div>
        <button
          aria-label="이전 페이지"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          ←
        </button>
        <span aria-live="polite">
          {page} / {pages}
        </span>
        <button
          aria-label="다음 페이지"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          →
        </button>
      </div>
    </div>
  );
}

export function AdminConsole({
  adminName,
  logoutAction,
  data, onRefresh, refreshing, onSaved,
}: {
  adminName: string;
  logoutAction: () => Promise<void>;
  data: AdminData;
  onRefresh: () => void;
  refreshing: boolean;
  onSaved: () => Promise<void>;
}) {
  const today = dateKey(data.generatedAt);
  const [view, setView] = useState<View>("overview");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [eventType, setEventType] = useState("all");
  const [result, setResult] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Member | null>(null);
  const [selectedLog, setSelectedLog] = useState<Activity | null>(null);
  const { users, events } = data;
  const memberMap = new Map(users.map((user) => [user.id, user]));
  const query = search.trim().toLocaleLowerCase();
  const matchMember = (member: Member) =>
    [
      member.name,
      member.nickname,
      member.email,
      member.id,
      member.jungleNumber,
    ].some((value) => value.toLocaleLowerCase().includes(query));
  const filteredUsers = users
    .filter(
      (user) =>
        matchMember(user) &&
        (status === "all" ||
          (status === "inside"
            ? isInside(user.id, events)
            : user.status === status)),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name, "ko")
        : b.joinedAt.localeCompare(a.joinedAt),
    );
  const invalidDates = Boolean(from && to && from > to);
  const filteredEvents = events.filter((event) => {
    const user = memberMap.get(event.userId);
    const day = dateKey(event.at);
    return (
      !invalidDates &&
      (!query ||
        Boolean(user && matchMember(user)) ||
        event.detail.toLocaleLowerCase().includes(query)) &&
      (!userFilter || event.userId === userFilter) &&
      (eventType === "all" || event.type === eventType) &&
      (result === "all" || event.result === result) &&
      (!from || day >= from) &&
      (!to || day <= to)
    );
  });
  const total = view === "users" ? filteredUsers.length : filteredEvents.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
  const start = (safePage - 1) * pageSize;
  const todayEvents = events.filter(
    (event) => dateKey(event.at) === today,
  );
  const attendance = new Set(
    todayEvents
      .filter((event) => event.type === "checkin" && event.result === "success")
      .map((event) => event.userId),
  ).size;
  const inside = users.filter((user) => isInside(user.id, events)).length;
  const suspended = users.filter((user) => user.status === "suspended").length;
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T12:00:00+09:00`);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const day = dateKey(date.toISOString());
    return {
      day,
      count: new Set(
        events
          .filter(
            (event) =>
              event.type === "checkin" &&
              event.result === "success" &&
              dateKey(event.at) === day,
          )
          .map((event) => event.userId),
      ).size,
    };
  });
  const maxVisits = Math.max(1, ...week.map((day) => day.count));

  function navigate(next: View, nextStatus: Status = "all") {
    setSelectedLog(null);
    setView(next);
    setSearch("");
    setStatus(nextStatus);
    setEventType("all");
    setResult("all");
    setFrom("");
    setTo("");
    setUserFilter("");
    setPage(1);
  }
  function exportRows() {
    if (view === "users") {
      downloadCsv("junglegym-users.csv", [
        [
          "사용자 ID",
          "이름",
          "닉네임",
          "이메일",
          "정글 번호",
          "상태",
          "가입일",
          "관리 메모",
        ],
        ...filteredUsers.map((user) => [
          user.id,
          user.name,
          user.nickname,
          user.email,
          user.jungleNumber,
          user.status === "active" ? "정상" : "이용 정지",
          formatDate(user.joinedAt),
          user.note,
        ]),
      ]);
    } else {
      downloadCsv("junglegym-logs.csv", [
        [
          "로그 ID",
          "발생 시각 (KST)",
          "사용자 ID",
          "이름",
          "활동",
          "결과",
          "실행 주체",
          "상세",
        ],
        ...filteredEvents.map((event) => [
          event.id,
          formatDate(event.at, true),
          event.userId,
          memberMap.get(event.userId)?.name ?? "알 수 없음",
          eventLabels[event.type],
          event.result === "success" ? "성공" : "실패",
          event.actorName ?? (event.actor === "admin" ? "관리자" : "사용자"),
          event.detail,
        ]),
      ]);
    }
    notify.success("현재 필터에 맞는 전체 데이터를 내려받았습니다.");
  }
  function openUserLogs(member: Member) {
    navigate("logs");
    setUserFilter(member.id);
    setSelected(null);
  }
  const memberRows = (rows: Member[]) => (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <caption className="sr-only">사용자 목록</caption>
        <thead>
          <tr>
            <th scope="col">사용자</th>
            <th scope="col">정글 번호</th>
            <th scope="col">이용 상태</th>
            <th scope="col">입실 상태</th>
            <th scope="col">가입일</th>
            <th scope="col">
              <span className="sr-only">관리</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((member, index) => (
            <tr key={member.id}>
              <td>
                <button
                  className={styles.memberButton}
                  onClick={() => setSelected(member)}
                >
                  <span
                    className={`${styles.avatar} ${styles[`avatar${index % 4}`] ?? ""}`}
                  >
                    {member.name.slice(0, 1)}
                  </span>
                  <span>
                    <strong>
                      {member.name}
                      <small>{member.nickname}</small>
                    </strong>
                    <span className={styles.email}>{member.email}</span>
                  </span>
                </button>
              </td>
              <td>{member.jungleNumber}</td>
              <td>
                <StatusBadge status={member.status} />
              </td>
              <td>
                {isInside(member.id, events) ? (
                  <span className={styles.inside}>
                    <i />
                    운동 중
                  </span>
                ) : (
                  <span className={styles.muted}>미입실</span>
                )}
              </td>
              <td className={styles.tabular}>{formatDate(member.joinedAt)}</td>
              <td>
                <button
                  className={styles.detailButton}
                  aria-label={`${member.name} 상세 보기`}
                  onClick={() => setSelected(member)}
                >
                  상세 <Icon name="arrow" size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <div className={styles.empty}>
          <Icon name="users" size={30} />
          <strong>검색 결과가 없습니다</strong>
          <p>검색어 또는 상태 필터를 변경해 주세요.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.console}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Logo className="w-[152px]" />
          <span>ADMIN CONSOLE</span>
        </div>
        <div className={styles.workspace}>
          <span className={styles.workspaceIcon}>J</span>
          <div>
            <strong>정글짐 워크스페이스</strong>
            <small>운영 관리자</small>
          </div>
          <span className={styles.localDot} />
        </div>
        <p className={styles.navLabel}>WORKSPACE</p>
        <nav aria-label="관리자 메뉴">
          {views.map((item) => (
            <button
              key={item.id}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
              className={view === item.id ? styles.navActive : ""}
            >
              <Icon name={item.icon} />
              <span>{item.title}</span>
              {item.id === "users" && <small>{users.length}</small>}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.localCard}>
            <Icon name="shield" />
            <strong>관리자 작업 기록</strong>
            <p>
              회원 정보 변경 내역은
              <br />
              서버에 기록됩니다.
            </p>
          </div>
          <Link href="/" className={styles.homeLink}>
            서비스 홈으로 <Icon name="arrow" size={16} />
          </Link>
          <div className={styles.operator}>
            <span>AD</span>
            <div>
              <strong>{adminName}</strong>
              <small>인증된 관리자</small>
            </div>
          </div>
        </div>
      </aside>
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <span>워크스페이스</span>
            <span>/</span>
            <strong>{views.find((item) => item.id === view)?.title}</strong>
          </div>
          <form action={logoutAction} className={styles.sessionControls}>
            <span>{adminName}</span>
            <button type="button" disabled={refreshing} onClick={onRefresh}>{refreshing ? "조회 중…" : "새로고침"}</button>
            <button type="submit">로그아웃</button>
          </form>
        </header>
        <div className={styles.content}>
          <div className={styles.pageHeading}>
            <div>
              <p className={styles.eyebrow}>JUNGLE GYM · ADMIN</p>
              <h1>
                {view === "overview"
                  ? "한눈에 보는 정글짐"
                  : view === "users"
                    ? "사용자 관리"
                    : "활동 로그"}
              </h1>
              <p>
                {view === "overview"
                  ? "사용자와 운동 현황을 확인하고, 오늘의 운영을 시작하세요."
                  : view === "users"
                    ? "사용자 정보를 확인하고 계정의 이용 상태를 관리하세요."
                    : "사용자 활동과 관리자 변경 내역을 시간순으로 확인하세요."}
              </p>
            </div>
            {view === "overview" ? (
              <div className={styles.dateStamp}>
                <span>한국 시간 기준일</span>
                <strong>
                  {formatDate(data.generatedAt)}
                </strong>
              </div>
            ) : (
              <button
                className={styles.outlineButton}
                disabled={total === 0}
                onClick={exportRows}
              >
                <Icon name="download" size={17} />
                CSV 다운로드
              </button>
            )}
          </div>
          {view === "overview" ? (
            <>
              <section className={styles.metrics} aria-label="운영 요약">
                {[
                  {
                    label: "전체 사용자",
                    value: users.length,
                    unit: "명",
                    note: `정상 이용 ${users.length - suspended}명`,
                    icon: "users" as const,
                    action: () => navigate("users"),
                  },
                  {
                    label: "기준일 출석",
                    value: attendance,
                    unit: "명",
                    note: "9월 29일 · 중복 입실 제외",
                    icon: "check" as const,
                    action: () => {
                      navigate("logs");
                      setEventType("checkin");
                      setFrom(today);
                      setTo(today);
                    },
                  },
                  {
                    label: "현재 운동 중",
                    value: inside,
                    unit: "명",
                    note: "마지막 입퇴실 기록 기준",
                    icon: "pulse" as const,
                    action: () => navigate("users", "inside"),
                  },
                  {
                    label: "이용 정지",
                    value: suspended,
                    unit: "명",
                    note: "확인이 필요한 사용자",
                    icon: "shield" as const,
                    action: () => navigate("users", "suspended"),
                  },
                ].map((metric) => (
                  <button
                    className={styles.metric}
                    key={metric.label}
                    onClick={metric.action}
                  >
                    <div>
                      <span>{metric.label}</span>
                      <Icon name={metric.icon} />
                    </div>
                    <strong>
                      {metric.value}
                      <small>{metric.unit}</small>
                    </strong>
                    <p>
                      {metric.note}
                      <Icon name="arrow" size={15} />
                    </p>
                  </button>
                ))}
              </section>
              <div className={styles.overviewGrid}>
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2>주간 출석 현황</h2>
                      <p>하루 한 번, 꾸준히 쌓이는 운동 습관</p>
                    </div>
                    <span className={styles.period}>{week[0]?.day.slice(5)} — {today.slice(5)}</span>
                  </div>
                  <div className={styles.chartSummary}>
                    <strong>
                      {week.reduce((sum, day) => sum + day.count, 0)}
                      <small>명·일</small>
                    </strong>
                    <span>7일간 일별 출석 인원 합계</span>
                  </div>
                  <div
                    className={styles.chart}
                    aria-label="최근 7일 일별 출석 인원"
                  >
                    {week.map((day, index) => (
                      <button
                        key={day.day}
                        className={`${styles.barGroup} ${index === 6 ? styles.currentBar : ""}`}
                        aria-label={`${day.day} 출석 ${day.count}명 로그 보기`}
                        onClick={() => {
                          navigate("logs");
                          setEventType("checkin");
                          setFrom(day.day);
                          setTo(day.day);
                        }}
                      >
                        <span className={styles.barTrack}>
                          <span
                            className={styles.bar}
                            style={{
                              height: `${Math.max(5, (day.count / maxVisits) * 100)}%`,
                            }}
                          >
                            <b>{day.count}</b>
                          </span>
                        </span>
                        <span>
                          {day.day.slice(5).replace("-", ".")}
                          <small>
                            {new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", weekday: "short" }).format(new Date(`${day.day}T12:00:00+09:00`))}
                          </small>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
                <section className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2>최근 활동</h2>
                      <p>가장 최근에 기록된 이벤트</p>
                    </div>
                    <button
                      className={styles.textButton}
                      onClick={() => navigate("logs")}
                    >
                      전체 보기 <Icon name="arrow" size={14} />
                    </button>
                  </div>
                  <div className={styles.activityList}>
                    {events.slice(0, 5).map((event) => (
                      <button
                        key={event.id}
                        className={styles.activityItem}
                        onClick={() => {
                          navigate("logs");
                          setUserFilter(event.userId);
                        }}
                      >
                        <span
                          className={`${styles.eventIcon} ${event.result === "failed" ? styles.eventFailed : ""}`}
                        >
                          <Icon
                            name={
                              event.result === "failed"
                                ? "shield"
                                : event.actor === "admin"
                                  ? "users"
                                  : "pulse"
                            }
                            size={17}
                          />
                        </span>
                        <span>
                          <strong>
                            {memberMap.get(event.userId)?.name ??
                              "알 수 없는 사용자"}
                            <span>
                              {eventLabels[event.type]}
                              {event.result === "failed" ? " 실패" : ""}
                            </span>
                          </strong>
                          <small>{formatDate(event.at, true)}</small>
                        </span>
                        <Icon name="arrow" size={15} />
                      </button>
                    ))}
                  </div>
                  <button
                    className={styles.reviewNotice}
                    onClick={() => {
                      navigate("logs");
                      setResult("all");
                      setFrom(today);
                      setTo(today);
                    }}
                  >
                    <span>
                      <i />
                      기준일 활동 기록 <strong>{todayEvents.length}건</strong>
                    </span>
                    <Icon name="arrow" size={16} />
                  </button>
                </section>
              </div>
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2>
                      최근 가입한 사용자{" "}
                      <span className={styles.count}>{users.length}</span>
                    </h2>
                    <p>새롭게 운동을 시작한 정글러를 만나보세요.</p>
                  </div>
                  <button
                    className={styles.textButton}
                    onClick={() => navigate("users")}
                  >
                    사용자 관리 <Icon name="arrow" size={15} />
                  </button>
                </div>
                {memberRows(
                  [...users]
                    .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
                    .slice(0, 5),
                )}
              </section>
            </>
          ) : (
            <section className={styles.card}>
              {view === "users" ? (
                <div className={styles.tabs} aria-label="사용자 상태 필터">
                  {(
                    [
                      { id: "all", label: "전체 사용자", count: users.length },
                      {
                        id: "active",
                        label: "정상",
                        count: users.length - suspended,
                      },
                      { id: "suspended", label: "이용 정지", count: suspended },
                      { id: "inside", label: "운동 중", count: inside },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      aria-pressed={status === tab.id}
                      className={status === tab.id ? styles.tabActive : ""}
                      onClick={() => {
                        setStatus(tab.id);
                        setPage(1);
                      }}
                    >
                      {tab.label}
                      <span>{tab.count}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.cardHeader}>
                  <div>
                    <h2>
                      활동 기록{" "}
                      <span className={styles.count}>{events.length}</span>
                    </h2>
                    <p>한국 시간(KST) 기준 · 관리자 변경 내역 포함</p>
                  </div>
                </div>
              )}
              <div className={styles.filters}>
                <label className={styles.search}>
                  <Icon name="search" size={18} />
                  <input
                    aria-label={view === "users" ? "사용자 검색" : "로그 검색"}
                    value={search}
                    placeholder={
                      view === "users"
                        ? "이름, 이메일, 닉네임 또는 정글 번호 검색"
                        : "사용자 또는 활동 내용 검색"
                    }
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                  />
                </label>
                {view === "users" ? (
                  <select
                    aria-label="사용자 정렬"
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="recent">최근 가입순</option>
                    <option value="name">이름순</option>
                  </select>
                ) : (
                  <>
                    <select
                      aria-label="활동 유형"
                      value={eventType}
                      onChange={(event) => {
                        setEventType(event.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="all">모든 활동</option>
                      {Object.entries(eventLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="활동 결과"
                      value={result}
                      onChange={(event) => {
                        setResult(event.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="all">모든 결과</option>
                      <option value="success">성공</option>
                      <option value="failed">실패</option>
                    </select>
                  </>
                )}
              </div>
              {view === "logs" && (
                <div className={styles.dateFilters}>
                  <label>
                    시작일
                    <input
                      type="date"
                      aria-label="로그 시작일"
                      value={from}
                      onChange={(event) => {
                        setFrom(event.target.value);
                        setPage(1);
                      }}
                    />
                  </label>
                  <span>—</span>
                  <label>
                    종료일
                    <input
                      type="date"
                      aria-label="로그 종료일"
                      value={to}
                      onChange={(event) => {
                        setTo(event.target.value);
                        setPage(1);
                      }}
                    />
                  </label>
                  {userFilter && (
                    <button
                      className={styles.filterChip}
                      onClick={() => {
                        setUserFilter("");
                        setPage(1);
                      }}
                    >
                      {memberMap.get(userFilter)?.name ?? userFilter}
                      <span className="sr-only"> 사용자 필터 해제</span>
                      <Icon name="close" size={13} />
                    </button>
                  )}
                  <button
                    className={styles.textButton}
                    onClick={() => navigate("logs")}
                  >
                    필터 초기화
                  </button>
                </div>
              )}
              {invalidDates && (
                <p role="alert" className={styles.dateError}>
                  종료일은 시작일 이후로 선택해 주세요.
                </p>
              )}
              {view === "users" ? (
                memberRows(filteredUsers.slice(start, start + pageSize))
              ) : (
                <div className={styles.tableScroll}>
                  <table className={`${styles.table} ${styles.logTable}`}>
                    <caption className="sr-only">활동 로그 목록</caption>
                    <thead>
                      <tr>
                        <th scope="col">발생 시각 (KST)</th>
                        <th scope="col">사용자</th>
                        <th scope="col">활동</th>
                        <th scope="col">결과</th>
                        <th scope="col">상세 내용</th>
                        <th scope="col">실행 주체</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents
                        .slice(start, start + pageSize)
                        .map((event) => (
                          <tr key={event.id}>
                            <td className={styles.tabular}>
                              {formatDate(event.at, true)}
                            </td>
                            <td>
                              <button
                                className={styles.logUser}
                                onClick={() =>
                                  setSelected(
                                    memberMap.get(event.userId) ?? null,
                                  )
                                }
                              >
                                {memberMap.get(event.userId)?.name ??
                                  "알 수 없음"}
                                <small>{event.userId}</small>
                              </button>
                            </td>
                            <td>
                              <span className={styles.typeBadge}>
                                {eventLabels[event.type as EventType]}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`${styles.badge} ${event.result === "success" ? styles.good : styles.danger}`}
                              >
                                <i />
                                {event.result === "success" ? "성공" : "실패"}
                              </span>
                            </td>
                            <td>
                              <button
                                className={styles.logDetail}
                                onClick={() =>
                                  setSelectedLog(
                                    selectedLog?.id === event.id ? null : event,
                                  )
                                }
                                aria-expanded={selectedLog?.id === event.id}
                              >
                                {event.detail}
                              </button>
                            </td>
                            <td className={styles.muted}>
                              {event.actorName ?? (event.actor === "admin" ? "관리자" : "사용자")}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {!filteredEvents.length && (
                    <div className={styles.empty}>
                      <Icon name="logs" size={30} />
                      <strong>조건에 맞는 로그가 없습니다</strong>
                      <p>검색어나 조회 기간을 변경해 주세요.</p>
                      <button
                        className={styles.textButton}
                        onClick={() => navigate("logs")}
                      >
                        필터 초기화
                      </button>
                    </div>
                  )}
                </div>
              )}
              {view === "logs" && selectedLog && (
                <div className={styles.logExpanded}>
                  <div>
                    <strong>{eventLabels[selectedLog.type]} 상세</strong>
                    <button
                      aria-label="로그 상세 닫기"
                      onClick={() => setSelectedLog(null)}
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                  <p>{selectedLog.detail}</p>
                  <small>
                    로그 ID: {selectedLog.id} ·{" "}
                    {formatDate(selectedLog.at, true)}
                  </small>
                </div>
              )}
              <Pagination page={safePage} total={total} onChange={setPage} />
            </section>
          )}
          <footer className={styles.footer}>
            <span>Jungle GYM Admin</span>
            <span>
              함께 만드는 건강한 운동 습관 <i />
              운영 관리자
            </span>
          </footer>
        </div>
      </div>
      {selected && (
        <MemberEditor
          key={selected.id}
          onSaved={onSaved}
          member={selected}
          events={events}
          onClose={() => setSelected(null)}
          onLogs={() => openUserLogs(selected)}
        />
      )}
    </div>
  );
}
