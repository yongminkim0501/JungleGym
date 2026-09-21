"use client";

import type { Visit } from "@/shared/api";
import { HistoryTable } from "./history-table";
import { MypageHeader } from "./mypage-header";

type MyHistoryViewProps = {
  visits: Visit[];
};

export function MyHistoryView({ visits }: MyHistoryViewProps) {
  return (
    <section className="flex w-full flex-1 bg-neutral-50/50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <MypageHeader title="입 · 퇴실 기록" />
        <HistoryTable visits={visits} />
      </div>
    </section>
  );
}
