import type { Metadata } from "next";

import { ExcelImportSection } from "@/components/library/excel-import-section";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "엑셀 일괄 등록" };

/**
 * 서버 컴포넌트로 유지한다 — `"use client"`를 붙이면 `metadata` export가 깨진다.
 * 파일 선택·업로드·결과 상태는 `ExcelImportSection`(클라이언트 경계)이 소유하고 여기서는 조립만 한다.
 * 좌우/상하 여백은 layout.tsx의 `<main>` 소유 → `px-page-x py-page-y` 재선언 금지.
 * 상단 탭 바는 `src/app/admin/layout.tsx`가 그린다.
 */
export default function ExcelImportPage() {
  return (
    <>
      <PageHeader
        title="엑셀 일괄 등록"
        description="하나의 엑셀 파일로 도서와 소장본을 함께 등록합니다"
      />
      <ExcelImportSection />
    </>
  );
}
