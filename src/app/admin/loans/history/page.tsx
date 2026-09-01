import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { LoanHistoryCard } from "@/components/library/loan-history-card";

export const metadata: Metadata = { title: "대출 내역 조회" };

/**
 * 서버 컴포넌트로 유지한다 — `metadata` export가 깨지지 않도록.
 * 필터·조회·페이지 상태는 `LoanHistoryCard`(클라이언트 경계)가 전부 소유하고
 * 여기서는 조립만 한다. 총 건수(`pagination.totalElements`)도 그 카드가 소유하므로
 * `PageHeader`로 끌어올리지 않고 결과 카드 헤더의 배지로 표시한다.
 * 좌우/상하 여백은 layout.tsx의 `<main>` 소유 → 재선언 금지.
 */
export default function LoanHistoryPage() {
  return (
    <>
      <PageHeader
        title="대출 내역 조회"
        description="대출 중·반납 완료 이력을 검색합니다"
      />
      <LoanHistoryCard />
    </>
  );
}
