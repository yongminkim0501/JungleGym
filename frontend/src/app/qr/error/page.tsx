import type { Metadata } from "next";
import { RouteScreen } from "../../_components";

export const metadata: Metadata = { title: "오류" };
export default function Page() {
  return <RouteScreen name="qr-error" />;
}
