"use client";

import type { Visit } from "@/shared/api";
import { ButtonLink } from "@/shared/ui";
import { accessHistoryRows, formatKstDate, formatKstTime } from "../lib";

type HistoryTableProps = {
  visits: Visit[];
};

export function HistoryTable({ visits }: HistoryTableProps) {
  const rows = accessHistoryRows(visits);

  return (
    <>
      {visits.some((visit) => visit.autoCheckedOut) && (
        <p className="text-sm leading-6 text-neutral-500">
          자동 퇴실의 시간은 시스템 처리 시각이며, 운동 시간은 59분으로
          기록됩니다.
        </p>
      )}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] table-fixed text-left">
            <thead className="bg-neutral-50 text-sm text-neutral-500">
              <tr>
                <th scope="col" className="min-w-[40px] px-3 py-3 font-medium">
                  구분
                </th>
                <th scope="col" className="min-w-[200px] px-5 py-3 font-medium">
                  날짜
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  시간
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  운동 시간
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {rows.length > 0 ? (
                rows.map((row) => {
                  const isCheckout = row.kind === "check-out";

                  return (
                    <tr key={row.key}>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            row.autoCheckedOut
                              ? "bg-amber-50 text-amber-700"
                              : isCheckout
                                ? "bg-red-50 text-red-500"
                                : "bg-emerald-50 text-[#05A96A]"
                          }`}
                        >
                          {row.autoCheckedOut
                            ? "자동 퇴실"
                            : isCheckout
                              ? "퇴실"
                              : "입실"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-neutral-600">
                        {formatKstDate(row.at)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-neutral-900">
                        {formatKstTime(row.at)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-neutral-600">
                        {row.durationMinutes === null
                          ? "—"
                          : `${row.durationMinutes}분`}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-sm text-neutral-400"
                  >
                    입 · 퇴실 기록이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ButtonLink
        href="/mypage/info"
        variant="primary"
        size="plain"
        className="w-full rounded-xl px-4 py-3"
      >
        내 프로필로 돌아가기
      </ButtonLink>
    </>
  );
}
