import type { Metadata } from "next";
import { RouteScreen } from "../../_components";

export const metadata: Metadata = { title: "내 프로필" };
export default function Page() {
  return <RouteScreen name="info" />;
}
