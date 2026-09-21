import type { Metadata } from "next";
import { RouteScreen } from "../_components";

export const metadata: Metadata = { title: "입퇴실" };
export default function Page() {
  return <RouteScreen name="qr" />;
}
