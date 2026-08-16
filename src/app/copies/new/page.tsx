import type { Metadata } from "next";

import { CopyRegisterSection } from "@/components/library/copy-register-section";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "소장본 등록" };

/**
 * 서버 컴포넌트로 유지한다 — `"use client"`를 붙이면 `metadata` export가 깨진다.
 * 폼·목록 상태와 fetch는 `CopyRegisterSection`(클라이언트 경계)이 소유하고 여기서는 조립만 한다.
 * 좌우/상하 여백은 layout.tsx의 `<main>` 소유 → `px-page-x py-page-y` 재선언 금지.
 */
export default function CopyRegisterPage() {
  return (
    <>
      <PageHeader
        title="소장본 등록"
        description="도서(Book)에 연결하여 실물 보유본을 등록합니다"
      />
      <CopyRegisterSection />
    </>
  );
}
