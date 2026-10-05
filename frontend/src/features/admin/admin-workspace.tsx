"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api";
import { adminApi } from "./api";
import { AdminConsole } from "./admin-console";

export function AdminWorkspace({ adminName }: { adminName: string }) {
  const router = useRouter();
  const queries = useQueryClient();
  const [logoutError, setLogoutError] = useState("");
  const query = useQuery({ queryKey: ["admin", "data"], queryFn: adminApi.data,
    retry: false, staleTime: 0, refetchOnWindowFocus: true });
  const unauthorized = query.error instanceof ApiError && query.error.status === 401;
  useEffect(() => {
    if (unauthorized) {
      queries.removeQueries({ queryKey: ["admin"] });
      router.replace("/admin/login"); router.refresh();
    }
  }, [unauthorized, queries, router]);
  async function logout() {
    setLogoutError("");
    try {
      await adminApi.logout();
      await queries.cancelQueries({ queryKey: ["admin"] });
      queries.removeQueries({ queryKey: ["admin"] });
      router.replace("/admin/login"); router.refresh();
    } catch (cause) { setLogoutError(cause instanceof Error ? cause.message : "로그아웃에 실패했습니다."); }
  }
  if (query.isPending || unauthorized) return <p role="status" className="m-auto p-8">관리자 정보를 확인하고 있습니다.</p>;
  if (query.isError) return <div role="alert" className="m-auto space-y-4 p-8 text-center">
    <p>{query.error.message}</p><button className="underline" onClick={() => void query.refetch()}>다시 시도</button>
  </div>;
  return <>
    {logoutError && <p role="alert" className="bg-red-50 p-3 text-center text-red-700">{logoutError}</p>}
    <AdminConsole adminName={adminName} logoutAction={logout} data={query.data}
      onRefresh={() => { void query.refetch(); }} refreshing={query.isFetching}
      onSaved={async () => { await queries.invalidateQueries({ queryKey: ["admin"] }); }} />
  </>;
}
