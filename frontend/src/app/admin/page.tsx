import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminWorkspace } from "@/features/admin";
import { getAdminSession } from "./auth";

export const metadata: Metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  return <AdminWorkspace adminName={admin.name} />;
}
