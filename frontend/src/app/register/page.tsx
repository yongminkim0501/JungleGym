import type { Metadata } from "next";
import { RouteScreen } from "../_components";

export const metadata: Metadata = { title: "회원가입" };
export default function Page() {
  return <RouteScreen name="register" />;
}
