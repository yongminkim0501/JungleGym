import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="m-auto space-y-4 p-8 text-center">
      <h1 className="text-xl font-semibold">로컬 전용 페이지입니다</h1>
      <p className="text-sm text-neutral-500">
        관리자 미리보기는 로컬 개발 모드에서 사용할 수 있습니다.
      </p>
      <Link
        href="/"
        className="inline-block text-sm text-emerald-700 underline"
      >
        서비스 홈으로
      </Link>
    </div>
  );
}
