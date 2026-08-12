import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { ReturnListCard } from "@/components/library/return-list-card";

export const metadata: Metadata = { title: "반납 처리" };

/**
 * 서버 컴포넌트로 유지한다 — `metadata` export가 깨지지 않도록.
 * 검색·조회·반납 처리 상태는 `ReturnListCard`(클라이언트 경계)가 전부 소유하고
 * 여기서는 조립만 한다. 좌우/상하 여백은 layout.tsx의 `<main>` 소유 → 재선언 금지.
 */
export default function ReturnPage() {
  return (
    <>
      <PageHeader
        title="반납 처리"
        description="대출 중인 소장본만 반납 처리할 수 있습니다"
      />
      <ReturnListCard />
    </>
  );
}
