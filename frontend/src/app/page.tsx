import type { Metadata } from "next";
import { RouteScreen } from "./_components";

export const metadata: Metadata = { title: "대시보드" };
export default function Page() {
  return <RouteScreen name="dashboard" />;
}
