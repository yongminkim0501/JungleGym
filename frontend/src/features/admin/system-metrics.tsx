"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api";
import { adminApi } from "./api";
import type { EndpointMetric, MetricPoint } from "./model";
import consoleStyles from "./admin-console.module.css";
import styles from "./system-metrics.module.css";

const ranges = [
  { hours: 1, label: "1시간" },
  { hours: 6, label: "6시간" },
  { hours: 24, label: "24시간" },
] as const;
// p95 above this is flagged in the endpoint table.
const slowMs = 1000;
const number = new Intl.NumberFormat("ko-KR");
const time = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function ms(value: number | null) {
  if (value === null) return "—";
  return value >= 1000
    ? `${(value / 1000).toFixed(2)}s`
    : `${value.toFixed(value < 10 ? 1 : 0)}ms`;
}
function uptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return days
    ? `${days}일 ${hours}시간`
    : hours
      ? `${hours}시간 ${minutes}분`
      : `${minutes}분`;
}
function routeLabel(uri: string) {
  // Spring tags requests that never reached a controller (security rejects, 404s) without a route.
  if (uri === "UNKNOWN") return "경로 없음 (인증 거부·404 등)";
  if (uri === "/**") return "정적 리소스·미등록 경로";
  return uri;
}

function TrendChart({
  title,
  points,
  value,
  format,
  from,
  to,
}: {
  title: string;
  points: MetricPoint[];
  value: (point: MetricPoint) => number | null;
  format: (value: number) => string;
  from: number;
  to: number;
}) {
  const [hover, setHover] = useState<MetricPoint | null>(null);
  const width = 640,
    height = 160,
    top = 12,
    bottom = 22;
  const values = points
    .map(value)
    .filter((item): item is number => item !== null);
  const max = Math.max(1, ...values) * 1.15;
  const x = (at: string) =>
    ((new Date(at).getTime() - from) / (to - from)) * width;
  const y = (v: number) => top + (1 - v / max) * (height - top - bottom);
  // Missing minutes (server down or no sample) break the line instead of being interpolated.
  const segments: MetricPoint[][] = [];
  let previous: MetricPoint | null = null;
  for (const point of points) {
    const current = value(point);
    const gap =
      previous &&
      new Date(point.at).getTime() - new Date(previous.at).getTime() > 90_000;
    if (current === null) {
      previous = null;
      continue;
    }
    if (!previous || gap) segments.push([]);
    segments.at(-1)!.push(point);
    previous = point;
  }
  const path = (segment: MetricPoint[]) =>
    segment
      .map(
        (point, index) =>
          `${index ? "L" : "M"}${x(point.at).toFixed(1)},${y(value(point)!).toFixed(1)}`,
      )
      .join("");
  const latest = [...points].reverse().find((point) => value(point) !== null);
  const peak = values.length ? Math.max(...values) : null;

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const at = from + ((event.clientX - rect.left) / rect.width) * (to - from);
    let nearest: MetricPoint | null = null;
    for (const point of points) {
      if (
        !nearest ||
        Math.abs(new Date(point.at).getTime() - at) <
          Math.abs(new Date(nearest.at).getTime() - at)
      )
        nearest = point;
    }
    setHover(nearest);
  }

  const hoverValue = hover ? value(hover) : null;
  return (
    <section className={consoleStyles.card}>
      <div className={consoleStyles.cardHeader}>
        <div>
          <h2>{title}</h2>
          <p>
            최근 {latest ? format(value(latest)!) : "—"} · 구간 최고{" "}
            {peak === null ? "—" : format(peak)}
          </p>
        </div>
      </div>
      {points.length === 0 ? (
        <p className={styles.chartEmpty}>
          아직 수집된 기록이 없습니다. 서버가 1분마다 기록을 남깁니다.
        </p>
      ) : (
        <div className={styles.chartWrap}>
          <div className={styles.plot}>
            <svg
              className={styles.chart}
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`${title}, 최근 값 ${latest ? format(value(latest)!) : "없음"}, 최고 ${peak === null ? "없음" : format(peak)}`}
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
            >
              {[0.5, 1].map((ratio) => (
                <line
                  key={ratio}
                  className={styles.grid}
                  x1={0}
                  x2={width}
                  y1={y((max / 1.15) * ratio)}
                  y2={y((max / 1.15) * ratio)}
                />
              ))}
              <line
                className={styles.baseline}
                x1={0}
                x2={width}
                y1={y(0)}
                y2={y(0)}
              />
              {segments.map((segment, index) => (
                <g key={index}>
                  <path
                    className={styles.area}
                    d={`${path(segment)}L${x(segment.at(-1)!.at).toFixed(1)},${y(0)}L${x(segment[0]!.at).toFixed(1)},${y(0)}Z`}
                  />
                  <path className={styles.line} d={path(segment)} />
                </g>
              ))}
              {hover && (
                <line
                  className={styles.crosshair}
                  x1={x(hover.at)}
                  x2={x(hover.at)}
                  y1={top}
                  y2={y(0)}
                />
              )}
            </svg>
            {hover && hoverValue !== null && (
              <span
                className={styles.dot}
                style={{
                  left: `${(x(hover.at) / width) * 100}%`,
                  top: `${(y(hoverValue) / height) * 100}%`,
                }}
              />
            )}
            {hover && (
              <div
                className={styles.tooltip}
                style={{
                  left: `${Math.min(85, Math.max(15, (x(hover.at) / width) * 100))}%`,
                }}
              >
                <strong>
                  {hoverValue === null ? "요청 없음" : format(hoverValue)}
                </strong>
                <span>{time.format(new Date(hover.at))}</span>
                {hover.serverErrors > 0 && (
                  <span className={styles.tooltipError}>
                    5xx {hover.serverErrors}건
                  </span>
                )}
              </div>
            )}
          </div>
          <div className={styles.axis}>
            <span>{time.format(new Date(from))}</span>
            <span>{time.format(new Date(to))}</span>
          </div>
        </div>
      )}
    </section>
  );
}

function EndpointTable({ endpoints }: { endpoints: EndpointMetric[] }) {
  return (
    <section className={consoleStyles.card}>
      <div className={consoleStyles.cardHeader}>
        <div>
          <h2>엔드포인트별 응답</h2>
          <p>
            요청 수·평균은 서버 시작 이후 누적, p95·최대는 최근 약 2분
            기준입니다.
          </p>
        </div>
      </div>
      {endpoints.length === 0 ? (
        <p className={styles.chartEmpty}>
          서버 시작 이후 처리한 요청이 없습니다.
        </p>
      ) : (
        <div className={consoleStyles.tableScroll}>
          <table className={consoleStyles.table}>
            <caption className="sr-only">
              엔드포인트별 요청 수와 응답 시간
            </caption>
            <thead>
              <tr>
                <th scope="col">엔드포인트</th>
                <th scope="col" className={styles.numeric}>
                  요청 수
                </th>
                <th scope="col" className={styles.numeric}>
                  평균
                </th>
                <th scope="col" className={styles.numeric}>
                  p95
                </th>
                <th scope="col" className={styles.numeric}>
                  최대
                </th>
                <th scope="col" className={styles.numeric}>
                  4xx
                </th>
                <th scope="col" className={styles.numeric}>
                  5xx
                </th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint) => (
                <tr key={`${endpoint.method} ${endpoint.uri}`}>
                  <td>
                    <span className={styles.method}>{endpoint.method}</span>
                    <span className={styles.route}>
                      {routeLabel(endpoint.uri)}
                    </span>
                  </td>
                  <td className={styles.numeric}>
                    {number.format(endpoint.count)}
                  </td>
                  <td className={styles.numeric}>{ms(endpoint.meanMs)}</td>
                  <td className={styles.numeric}>
                    {endpoint.p95Ms !== null && endpoint.p95Ms >= slowMs ? (
                      <span className={styles.slow}>
                        ▲ {ms(endpoint.p95Ms)} 느림
                      </span>
                    ) : (
                      ms(endpoint.p95Ms)
                    )}
                  </td>
                  <td className={styles.numeric}>{ms(endpoint.maxMs)}</td>
                  <td className={styles.numeric}>
                    {endpoint.clientErrors
                      ? number.format(endpoint.clientErrors)
                      : "—"}
                  </td>
                  <td className={styles.numeric}>
                    {endpoint.serverErrors ? (
                      <span className={styles.error}>
                        ● {number.format(endpoint.serverErrors)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function SystemMetricsView() {
  const router = useRouter();
  const queries = useQueryClient();
  const [hours, setHours] = useState<(typeof ranges)[number]["hours"]>(1);
  const query = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: adminApi.metrics,
    retry: false,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const unauthorized =
    query.error instanceof ApiError && query.error.status === 401;
  useEffect(() => {
    if (unauthorized) {
      queries.removeQueries({ queryKey: ["admin"] });
      router.replace("/admin/login");
      router.refresh();
    }
  }, [unauthorized, queries, router]);

  const data = query.data;
  const slice = useMemo(() => {
    if (!data) return null;
    const to = new Date(data.generatedAt).getTime();
    const from = to - hours * 3600_000;
    const points = data.history.filter(
      (point) => new Date(point.at).getTime() >= from,
    );
    return {
      from,
      to,
      points,
      requests: points.reduce((sum, point) => sum + point.requests, 0),
      serverErrors: points.reduce((sum, point) => sum + point.serverErrors, 0),
    };
  }, [data, hours]);

  if (query.isPending || unauthorized)
    return (
      <p role="status" className={styles.chartEmpty}>
        시스템 지표를 불러오고 있습니다.
      </p>
    );
  if (query.isError || !data || !slice) {
    return (
      <div role="alert" className={styles.chartEmpty}>
        <p>{query.error?.message ?? "시스템 지표를 불러오지 못했습니다."}</p>
        <button className="underline" onClick={() => void query.refetch()}>
          다시 시도
        </button>
      </div>
    );
  }

  const heapRatio = data.jvm.heapMaxMb
    ? data.jvm.heapUsedMb / data.jvm.heapMaxMb
    : 0;
  const tiles = [
    {
      label: "가동 시간",
      value: uptime(data.uptimeSeconds),
      note: `시작 ${time.format(new Date(data.startedAt))} (KST)`,
    },
    {
      label: "힙 메모리",
      value: `${number.format(data.jvm.heapUsedMb)}MB`,
      note: `최대 ${number.format(data.jvm.heapMaxMb)}MB 중 ${Math.round(heapRatio * 100)}%`,
      warn: heapRatio >= 0.85,
    },
    {
      label: "DB 연결",
      value:
        data.db.active === null
          ? "—"
          : `${data.db.active} / ${data.db.max ?? "—"}`,
      note: data.db.pending
        ? `대기 중인 요청 ${data.db.pending}건`
        : "사용 중 / 최대",
      warn: Boolean(data.db.pending),
    },
    {
      label: `최근 ${hours}시간 요청`,
      value: number.format(slice.requests),
      note: slice.serverErrors
        ? `서버 오류(5xx) ${slice.serverErrors}건`
        : "서버 오류(5xx) 없음",
      warn: slice.serverErrors > 0,
    },
  ];

  return (
    <div className={query.isFetching ? styles.refreshing : undefined}>
      <div className={styles.toolbar}>
        <div className={styles.segmented} role="group" aria-label="조회 기간">
          {ranges.map((range) => (
            <button
              key={range.hours}
              aria-pressed={hours === range.hours}
              onClick={() => setHours(range.hours)}
            >
              {range.label}
            </button>
          ))}
        </div>
        <span className={styles.updated}>
          {time.format(new Date(data.generatedAt))} 기준 · 30초마다 자동 갱신
        </span>
      </div>
      <section className={styles.tiles} aria-label="시스템 요약">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className={`${styles.tile} ${tile.warn ? styles.tileWarn : ""}`}
          >
            <span>{tile.label}</span>
            <strong>{tile.value}</strong>
            <p>
              {tile.warn && "⚠ "}
              {tile.note}
            </p>
          </div>
        ))}
      </section>
      <div className={styles.charts}>
        <TrendChart
          title="분당 요청 수"
          points={slice.points}
          value={(point) => point.requests}
          format={(value) => `${number.format(value)}건`}
          from={slice.from}
          to={slice.to}
        />
        <TrendChart
          title="분당 평균 응답 시간"
          points={slice.points}
          value={(point) => point.meanMs}
          format={(value) => ms(value)}
          from={slice.from}
          to={slice.to}
        />
      </div>
      <EndpointTable endpoints={data.endpoints} />
    </div>
  );
}
