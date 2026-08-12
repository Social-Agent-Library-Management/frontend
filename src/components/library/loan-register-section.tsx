"use client";

import * as React from "react";

import { LoanListCard } from "@/components/library/loan-list-card";
import { LoanRegisterForm } from "@/components/library/loan-register-form";

export interface LoanRegisterSectionProps {
  className?: string;
}

/**
 * 대출 등록 화면의 클라이언트 경계이자 폼·목록의 유일한 공유 상태 소유자.
 *
 * 페이지(`src/app/loans/new/page.tsx`)는 `metadata`를 export해야 하므로 서버 컴포넌트로 남는다.
 * 폼과 목록을 페이지에서 직접 배치하지 말 것 — refreshToken 배선을 손으로 하지 않는다.
 */
export function LoanRegisterSection({ className }: LoanRegisterSectionProps) {
  // 등록 성공 때마다 증가 → LoanListCard가 이 값 변화를 refetch 신호로 쓴다.
  // 낙관적 추가는 하지 않는다 — 서버가 확정한 dueDate/overdue만 신뢰한다.
  const [refreshToken, setRefreshToken] = React.useState(0);

  return (
    <div className={className}>
      <LoanRegisterForm
        className="mb-5"
        onCreated={() => setRefreshToken((t) => t + 1)}
      />
      <LoanListCard refreshToken={refreshToken} />
    </div>
  );
}
