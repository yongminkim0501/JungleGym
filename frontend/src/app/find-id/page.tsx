import type { Metadata } from "next";
import { RouteScreen } from "../_components";

export const metadata: Metadata = { title: "아이디 찾기" };
export default function Page() {
  return <RouteScreen name="find-id" />;
}
