import type { Metadata } from "next";

import { LoanRegisterSection } from "@/components/library/loan-register-section";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "대출 등록" };

/**
 * 서버 컴포넌트로 유지한다 — `"use client"`를 붙이면 `metadata` export가 깨진다.
 * 폼 상태·fetch·refreshToken은 `LoanRegisterSection`(클라이언트 경계)이 소유하고
 * 여기서는 조립만 한다. 좌우/상하 여백은 layout.tsx의 `<main>` 소유 → 재선언 금지.
 */
export default function LoanRegisterPage() {
  return (
    <>
      <PageHeader
        title="대출 등록"
        description="소장본 관리번호 기준으로 대출을 등록합니다"
      />
      <LoanRegisterSection />
    </>
  );
}
