import type * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ListErrorStateProps {
  /** 사용자에게 그대로 보여줄 문구. API 실패는 `ApiError.detail`을 넘긴다. */
  message: string;
  /** 재시도 핸들러. 생략하면 버튼을 렌더하지 않는다(재시도 불가능한 에러용). */
  onRetry?: () => void;
  /** 재시도 버튼 라벨. 기본 "다시 시도" */
  retryLabel?: string;
  className?: string;
}

/**
 * 목록 조회 실패 자리에 표를 대신해 렌더하는 상태 블록.
 *
 * `BookListCard`/`LoanListCard`/`ReturnListCard`/`LoanHistoryCard` 4곳에 바이트 단위로
 * 동일하게 복제돼 있던 마크업을 승격한 것이다. **목록 카드마다 에러 UI를 다시 마크업하지
 * 말 것** — 문구·여백·재시도 버튼이 화면마다 갈라진다.
 *
 * variant는 두지 않는다. 변형 축이 없어 cva가 필요 없다.
 * `"use client"`를 붙이지 않는다 — 클라이언트 경계는 `Button`이 갖고, 이 컴포넌트는
 * 핸들러를 prop으로 받기만 한다(`Card`/`Badge`와 동일 취급).
 */
export function ListErrorState({
  message,
  onRetry,
  retryLabel = "다시 시도",
  className,
}: ListErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      {/* 표 자리가 에러로 대체되는 라이브 영역이라 스크린리더가 침묵하면 안 된다. */}
      <p role="status" className="text-body leading-normal text-fg-muted">
        {message}
      </p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
