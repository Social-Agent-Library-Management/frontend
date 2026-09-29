import type { Metadata } from "next";

import { BookSearchSection } from "@/components/library/book-search-section";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "도서 검색" };

/**
 * 서버 컴포넌트로 유지한다 — "use client"를 붙이면 `metadata` export가 깨진다.
 * 검색어·선택·조회 상태는 `BookSearchSection`(클라이언트 경계)이 전부 소유한다.
 * 좌우/상하 여백은 layout의 `<main>`이 소유한다.
 */
export default function BookSearchPage() {
  return (
    <>
      <PageHeader
        title="도서 검색"
        description="도서를 검색하면 첫 번째 도서의 소장본이 바로 표시되고, 다른 행을 선택해 바꿀 수 있습니다"
      />
      <BookSearchSection />
    </>
  );
}
