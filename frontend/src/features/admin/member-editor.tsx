"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/shared/api";
import { Button, Dialog } from "@/shared/ui";
import { notify } from "@/shared/notifications";
import {
  eventLabels,
  formatDate,
  memberSchema,
  type Activity,
  type Member,
} from "./model";
import { adminApi } from "./api";
import styles from "./admin-console.module.css";

export function MemberEditor({
  onSaved,
  member,
  events,
  onClose,
  onLogs,
}: {
  onSaved: () => Promise<void>;
  member: Member;
  events: Activity[];
  onClose: () => void;
  onLogs: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(member);
  const [error, setError] = useState("");
  const history = events.filter((event) => event.userId === member.id);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = memberSchema.safeParse(draft);
    if (!parsed.success) {
      setError(
        "이름(1~50자), 닉네임(4~25자), 이메일 형식과 메모(500자 이내)를 확인해 주세요.",
      );
      return;
    }
    if (draft.status !== member.status && !draft.note.trim()) {
      setError("이용 상태를 변경하는 사유를 관리 메모에 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      await adminApi.update(parsed.data);
      notify.success("회원 정보를 저장했습니다.");
      onClose();
      await onSaved();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        router.replace("/admin/login"); router.refresh();
      }
      setError(cause instanceof Error ? cause.message : "저장에 실패했습니다.");
    } finally { setSaving(false); }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
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
          <span className={styles.demoBadge}>등록 회원</span>
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
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            취소
          </Button>
          <Button type="submit" disabled={saving}>{saving ? "저장 중…" : "변경사항 저장"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
