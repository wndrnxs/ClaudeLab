import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@fontsource/noto-serif-kr/400.css";
import "@fontsource/noto-serif-kr/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "근거노트",
  description: "지문 근거로 검증하는 국어 문항 만들기와 학습 분석",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
