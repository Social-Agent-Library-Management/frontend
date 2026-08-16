"use client";

import * as React from "react";

import { CopyListCard } from "@/components/library/copy-list-card";
import { CopyRegisterForm } from "@/components/library/copy-register-form";

export interface CopyRegisterSectionProps {
  className?: string;
}

/**
 * 소장본 등록 화면의 클라이언트 경계이자 폼·목록의 유일한 공유 상태 소유자.
 *
 * 페이지(`src/app/copies/new/page.tsx`)는 `metadata`를 export해야 하므로 서버 컴포넌트로 남는다.
 * 폼과 목록을 페이지에서 직접 배치하지 말 것 — refreshToken 배선을 손으로 하지 않는다.
 *
 * 이 토큰은 **등록 성공 전용**이다. 목록 자체 행위(분실·폐기)로 인한 재조회는
 * `CopyListCard`가 내부 `fetchToken`으로 소유한다 — 상태 변경 때마다 페이지가 1로
 * 되돌아가지 않게 하기 위해 두 트리거를 분리한다.
 */
export function CopyRegisterSection({ className }: CopyRegisterSectionProps) {
  // 등록 성공 때마다 증가 → CopyListCard가 이 값 변화를 "1페이지로 리셋 + refetch" 신호로 쓴다.
  // 낙관적 추가는 하지 않는다 — 서버가 부여한 id/createdAt만 신뢰한다.
  const [refreshToken, setRefreshToken] = React.useState(0);

  return (
    <div className={className}>
      <CopyRegisterForm
        className="mb-5"
        onCreated={() => setRefreshToken((t) => t + 1)}
      />
      <CopyListCard refreshToken={refreshToken} />
    </div>
  );
}
