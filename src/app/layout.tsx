import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

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
  title: "도서 관리 시스템",
  description: "도서 등록·대출·반납·연체를 관리하는 도서관 운영 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
