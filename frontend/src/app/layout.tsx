import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Chrome, Providers } from "./_components";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Jungle GYM", template: "%s | Jungle GYM" },
  description: "정글짐에서 함께 만드는 건강한 운동 습관",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="flex min-h-dvh w-full flex-col">
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:p-3"
          >
            본문으로 이동
          </a>
          <Chrome />
          <main id="main-content" className="flex w-full flex-1 flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
