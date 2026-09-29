import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminConsole } from "@/features/admin";

export const metadata: Metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  // This local prototype has no production administrator authorization.
  if (process.env.NODE_ENV !== "development") notFound();
  return <AdminConsole />;
}
