"use client";

import { useState, type FormEvent } from "react";
import { Button, Dialog } from "@/shared/ui";
import { notify } from "@/shared/notifications";
import {
  eventLabels,
  formatDate,
  memberSchema,
  type Activity,
  type Member,
} from "./model";
import { saveAdminData } from "./store";
import styles from "./admin-console.module.css";

export function MemberEditor({
  member,
  events,
  onClose,
  onLogs,
}: {
  member: Member;
  events: Activity[];
  onClose: () => void;
  onLogs: () => void;
}) {
  const [draft, setDraft] = useState(member);
  const [error, setError] = useState("");
  const history = events.filter((event) => event.userId === member.id);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = memberSchema.safeParse(draft);
    if (!parsed.success) {
      setError(
        "이름(1~50자), 닉네임(1~25자), 이메일 형식과 메모(500자 이내)를 확인해 주세요.",
      );
      return;
    }
    if (draft.status !== member.status && !draft.note.trim()) {
      setError("이용 상태를 변경하는 사유를 관리 메모에 입력해 주세요.");
      return;
    }
    try {
      saveAdminData((current) => {
        const previous = current.users.find((user) => user.id === member.id);
        if (!previous || JSON.stringify(previous) !== JSON.stringify(member))
          throw new Error(
            "이 사용자의 정보가 다른 창에서 변경됐습니다. 창을 닫고 다시 열어 주세요.",
          );
        const next = parsed.data;
        if (
          current.users.some(
            (user) =>
              user.id !== member.id &&
              (user.nickname.toLowerCase() === next.nickname.toLowerCase() ||
                user.email.toLowerCase() === next.email.toLowerCase()),
          )
        )
          throw new Error("다른 사용자가 사용 중인 닉네임 또는 이메일입니다.");
        const fields = (
          ["name", "nickname", "email", "status", "note"] as const
        ).filter((key) => previous[key] !== next[key]);
        if (!fields.length) return current;
        const labels = {
          name: "이름",
          nickname: "닉네임",
          email: "이메일",
          status: "이용 상태",
          note: "관리 메모",
        };
        const log: Activity = {
          id: crypto.randomUUID(),
          userId: member.id,
          at: new Date().toISOString(),
          result: "success",
          actor: "admin",
          type:
            next.status !== previous.status
              ? next.status === "suspended"
                ? "suspend"
                : "restore"
              : "update",
          detail: `${fields.map((field) => labels[field]).join(", ")} 변경${next.status !== previous.status ? ` · 사유: ${next.note}` : ""}`,
        };
        return {
          ...current,
          users: current.users.map((user) =>
            user.id === member.id ? next : user,
          ),
          events: [log, ...current.events].sort((a, b) =>
            b.at.localeCompare(a.at),
          ),
        };
      });
      notify.success("사용자 정보를 로컬에 저장했습니다.");
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error &&
          !["QuotaExceededError", "SecurityError"].includes(cause.name)
          ? cause.message
          : "브라우저에 저장하지 못했습니다. 저장 공간과 브라우저 설정을 확인해 주세요.",
      );
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="사용자 상세"
      description={`${member.id} · ${member.jungleNumber} · ${formatDate(member.joinedAt)} 가입`}
      header="visible"
      showCloseButton
      className="max-w-xl"
    >
      <form onSubmit={save} className={styles.editor}>
        <div className={styles.editorIdentity}>
          <span className={styles.avatar}>{member.name.slice(0, 1)}</span>
          <div>
            <strong>{member.name}</strong>
            <p>{member.email}</p>
          </div>
          <span className={styles.demoBadge}>예시 사용자</span>
        </div>
        <div className={styles.formGrid}>
          <label>
            이름
            <input
              required
              maxLength={50}
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
            />
          </label>
          <label>
            닉네임
            <input
              required
              maxLength={25}
              value={draft.nickname}
              onChange={(event) =>
                setDraft({ ...draft, nickname: event.target.value })
              }
            />
          </label>
        </div>
        <label>
          이메일
          <input
            required
            type="email"
            value={draft.email}
            onChange={(event) =>
              setDraft({ ...draft, email: event.target.value })
            }
          />
        </label>
        <label>
          이용 상태
          <select
            value={draft.status}
            onChange={(event) =>
              setDraft({
                ...draft,
                status: event.target.value as Member["status"],
              })
            }
          >
            <option value="active">정상</option>
            <option value="suspended">이용 정지</option>
          </select>
        </label>
        <label>
          관리 메모 <span className={styles.hint}>상태 변경 시 사유 필수</span>
          <textarea
            rows={3}
            maxLength={500}
            value={draft.note}
            placeholder="사용자 관리에 필요한 메모를 남겨 주세요."
            onChange={(event) =>
              setDraft({ ...draft, note: event.target.value })
            }
          />
        </label>
        <div className={styles.editorHistory}>
          <div className={styles.sectionTitle}>
            <h3>최근 활동</h3>
            <button type="button" onClick={onLogs}>
              전체 보기 →
            </button>
          </div>
          {history.slice(0, 3).map((item) => (
            <div key={item.id}>
              <span>
                {eventLabels[item.type]}
                {item.result === "failed" ? " 실패" : ""}
              </span>
              <time dateTime={item.at}>{formatDate(item.at, true)}</time>
            </div>
          ))}
          {!history.length && <p>활동 기록이 없습니다.</p>}
        </div>
        {error && (
          <p role="alert" className={styles.formError}>
            {error}
          </p>
        )}
        <div className={styles.editorFooter}>
          <p>변경 내역은 관리자 활동 로그에 남습니다.</p>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit">변경사항 저장</Button>
        </div>
      </form>
    </Dialog>
  );
}
