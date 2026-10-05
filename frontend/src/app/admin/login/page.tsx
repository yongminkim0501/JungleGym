import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "../auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "관리자 로그인",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const admin = await getAdminSession().catch(() => null);
  if (admin) redirect("/admin");
  return <LoginForm />;
}
