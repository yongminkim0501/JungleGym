import type { Metadata } from "next";
import { RouteScreen } from "../_components";

export const metadata: Metadata = { title: "비밀번호 찾기" };
export default function Page() {
  return <RouteScreen name="find-password" />;
}
