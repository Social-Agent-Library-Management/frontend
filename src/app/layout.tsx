import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

import { AppSidebar } from "@/components/library/app-sidebar";

/**
 * 디자인 원본(tokens/typography.css)은 fonts.googleapis.com 을 @import 했으나,
 * 렌더 블로킹·외부 요청을 피하기 위해 next/font로 셀프호스팅한다.
 */
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "도서 관리 시스템",
    template: "%s · 도서 관리 시스템",
  },
  description: "도서 등록·대출·반납·연체를 관리하는 도서관 운영 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      {/* 사이드바는 고정, 콘텐츠 영역만 스크롤되는 앱 셸.
          컨테이너 <div> 없이 <body> 자체를 flex row로 쓴다. */}
      <body className="flex h-full overflow-hidden">
        {/* 7개 메뉴를 건너뛰는 키보드 접근성. 항상 flow 밖(fixed)이라 flex 레이아웃에 영향 없다. */}
        <a
          href="#main-content"
          className="fixed top-4 left-4 z-50 -translate-y-20 rounded-button bg-surface px-4 py-2 text-body font-semibold text-primary transition-transform focus:translate-y-0 focus-ring"
        >
          본문 바로가기
        </a>
        <AppSidebar />
        {/* 페이지 좌우/상하 여백은 여기가 단일 진실 원천이다.
            페이지·컴포넌트에서 px-page-x py-page-y를 다시 쓰지 말 것. */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto bg-canvas px-5 py-6 sm:px-page-x sm:py-page-y"
        >
          {children}
        </main>
      </body>
    </html>
  );
}
