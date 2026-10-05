import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="m-auto space-y-4 p-8 text-center">
      <h1 className="text-xl font-semibold">관리자 페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-neutral-500">
        주소를 확인한 뒤 다시 접속해 주세요.
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
