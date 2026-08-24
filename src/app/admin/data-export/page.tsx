import type { Metadata } from "next";

import { DataExportSection } from "@/components/library/data-export-section";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "내보내기" };

/**
 * 서버 컴포넌트로 유지한다 — `"use client"`를 붙이면 `metadata` export가 깨진다.
 * 시트 선택·옵션·다운로드는 `DataExportSection`(클라이언트 경계)이 소유하고 여기서는 조립만 한다.
 * 좌우/상하 여백은 layout.tsx의 `<main>` 소유 → `px-page-x py-page-y` 재선언 금지.
 * 상단 탭 바는 `src/app/admin/layout.tsx`가 그린다.
 */
export default function DataExportPage() {
  return (
    <>
      <PageHeader
        title="내보내기"
        description="저장된 데이터를 엑셀 파일로 바로 다운로드합니다 · 도서 / 소장본 / 대여 세 시트"
      />
      <DataExportSection />
    </>
  );
}
