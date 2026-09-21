"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { QueryBoundary } from "@/shared/query";
import { ScreenSkeleton } from "./screen-skeleton";
import type { ScreenKind } from "./screen-skeleton";

function protectedRoute(Content: ComponentType, kind: ScreenKind) {
  return dynamic(
    () =>
      import("./protected-screen").then(
        ({ ProtectedScreen }) =>
          function ProtectedRoute() {
            return (
              <ProtectedScreen>
                <Content />
              </ProtectedScreen>
            );
          },
      ),
    { ssr: false, loading: () => <ScreenSkeleton kind={kind} /> },
  );
}

const screens = {
  login: dynamic(() => import("@/screens/auth").then((m) => m.LoginScreen), {
    ssr: false,
    loading: () => <ScreenSkeleton />,
  }),
  register: dynamic(
    () => import("@/screens/auth").then((m) => m.RegisterScreen),
    { ssr: false, loading: () => <ScreenSkeleton kind="register" /> },
  ),
  "find-id": dynamic(
    () => import("@/screens/auth").then((m) => m.FindIdScreen),
    { ssr: false, loading: () => <ScreenSkeleton kind="find-id" /> },
  ),
  "find-password": dynamic(
    () => import("@/screens/auth").then((m) => m.FindPasswordScreen),
    { ssr: false, loading: () => <ScreenSkeleton kind="find-password" /> },
  ),
  dashboard: protectedRoute(
    dynamic(
      () =>
        import("./dashboard-composition").then((m) => m.DashboardComposition),
      { ssr: false, loading: () => <ScreenSkeleton kind="dashboard" /> },
    ),
    "dashboard",
  ),
  qr: protectedRoute(
    dynamic(() => import("@/screens/qr").then((m) => m.QrScreen), {
      ssr: false,
      loading: () => <ScreenSkeleton kind="qr" />,
    }),
    "qr",
  ),
  "qr-success": protectedRoute(
    dynamic(() => import("@/screens/qr").then((m) => m.QrSuccessScreen), {
      ssr: false,
      loading: () => <ScreenSkeleton kind="qr-success" />,
    }),
    "qr-success",
  ),
  "qr-error": protectedRoute(
    dynamic(() => import("@/screens/qr").then((m) => m.QrErrorScreen), {
      ssr: false,
      loading: () => <ScreenSkeleton kind="qr-error" />,
    }),
    "qr-error",
  ),
  info: protectedRoute(
    dynamic(() => import("@/screens/mypage").then((m) => m.MyInfoScreen), {
      ssr: false,
      loading: () => <ScreenSkeleton kind="info" />,
    }),
    "info",
  ),
  history: protectedRoute(
    dynamic(() => import("@/screens/mypage").then((m) => m.MyHistoryScreen), {
      ssr: false,
      loading: () => <ScreenSkeleton kind="history" />,
    }),
    "history",
  ),
};
const publicScreens = new Set<keyof typeof screens>([
  "login",
  "register",
  "find-id",
  "find-password",
]);

export function RouteScreen({ name }: { name: keyof typeof screens }) {
  const Content = screens[name];
  const isPublic = publicScreens.has(name);
  const fallback = <ScreenSkeleton kind={name} />;
  return (
    <QueryBoundary
      key={name}
      fallback={fallback}
      {...(!isPublic ? { unauthorizedHref: "/login" } : {})}
    >
      <Content />
    </QueryBoundary>
  );
}
