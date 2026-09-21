import type { Metadata } from "next";
import { RouteScreen } from "../../_components";

export const metadata: Metadata = { title: "활동기록" };
export default function Page() {
  return <RouteScreen name="history" />;
}
