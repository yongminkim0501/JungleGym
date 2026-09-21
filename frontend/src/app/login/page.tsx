import type { Metadata } from "next";
import { RouteScreen } from "../_components";

export const metadata: Metadata = { title: "로그인" };
export default function Page() {
  return <RouteScreen name="login" />;
}
