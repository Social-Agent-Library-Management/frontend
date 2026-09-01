import type { Metadata } from "next";

import { BookRegisterSection } from "@/components/library/book-register-section";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "도서 등록" };

/**
 * 서버 컴포넌트로 유지한다 — "use client"를 붙이면 `metadata` export가 깨진다.
 * 페이지는 조립만 한다(폼 상태·fetch·className 조합을 여기 두지 말 것).
 * 좌우/상하 여백은 layout의 `<main>`이 소유한다.
 */
export default function BookRegisterPage() {
  return (
    <>
      <PageHeader title="도서 등록" />
      <BookRegisterSection />
    </>
  );
}
