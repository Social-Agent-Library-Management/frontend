"use client";

import * as React from "react";

import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ListErrorState } from "@/components/ui/list-error-state";
import { StatusBadge } from "@/components/library/status-badge";
import { LOAN_COLUMNS, toLoanBadgeStatus } from "@/components/library/loan-table";
import { isApiError } from "@/lib/api/client";
import {
  searchLoans,
  type LoanSearchResult,
  type LoanSummary,
} from "@/lib/api/loans";

export interface LoanListCardProps {
  /** 값이 바뀌면 1페이지로 되돌린 뒤 재조회한다 */
  refreshToken?: number;
  /** 페이지당 행 수. 기본 10 (API 기본값) */
  pageSize?: number;
  className?: string;
}

/**
 * 현재 대출 현황 카드. 조회·페이지 상태·로딩/에러를 한 책임으로 묶는다.
 *
 * 서버 페이지네이션이므로 `DataTable`의 `serverPagination`을 쓴다
 * (`Pagination`을 표 아래에 손으로 붙이지 않는다).
 */
export function LoanListCard({
  refreshToken = 0,
  pageSize = 10,
  className,
}: LoanListCardProps) {
  const [page, setPage] = React.useState(1);
  const [retry, setRetry] = React.useState(0);
  // 마지막으로 완료된 요청. loading/error를 별도 state로 두고 effect 첫 줄에서
  // setState 하면 캐스케이딩 렌더가 되므로(react-hooks/set-state-in-effect),
  // "요청 키 vs 완료 키" 비교로 파생시킨다.
  const [settled, setSettled] = React.useState<{
    key: string;
    result: LoanSearchResult | null;
    error: string | null;
  }>({ key: "", result: null, error: null });

  // refreshToken이 바뀌면 페이지를 1로 되돌린다(렌더 중 조정 — 캐스케이딩 렌더 방지).
  const [prevToken, setPrevToken] = React.useState(refreshToken);
  if (refreshToken !== prevToken) {
    setPrevToken(refreshToken);
    setPage(1);
  }

  const requestKey = `${page}:${pageSize}:${refreshToken}:${retry}`;

  React.useEffect(() => {
    const controller = new AbortController();
    // 반납된 건은 "현재 대출 현황"이 아니므로 서버 필터로 제외한다.
    searchLoans({ status: "ON_LOAN", page, pageSize }, controller.signal)
      .then((data) =>
        setSettled({ key: requestKey, result: data, error: null }),
      )
      .catch((e: unknown) => {
        // 경합/언마운트 취소는 무시한다.
        if (controller.signal.aborted) return;
        setSettled((prev) => ({
          key: requestKey,
          result: prev.result,
          error: isApiError(e) ? e.detail : "목록을 불러오지 못했습니다.",
        }));
      });
    return () => controller.abort();
  }, [page, pageSize, requestKey]);

  const loading = settled.key !== requestKey;
  const error = loading ? null : settled.error;
  const result = settled.result;
  const rows = result?.loans ?? [];
  const total = result?.pagination.totalElements ?? 0;

  return (
    <Card title="현재 대출 현황" titleAs="h2" noPadding className={className}>
      {error ? (
        <ListErrorState message={error} onRetry={() => setRetry((n) => n + 1)} />
      ) : (
        <DataTable<LoanSummary>
          caption="현재 대출 중인 소장본 목록"
          columns={LOAN_COLUMNS}
          rows={rows}
          loading={loading}
          emptyText="현재 대출 중인 소장본이 없습니다."
          renderCell={(col, value, row) =>
            col.key === "status" ? (
              <StatusBadge status={toLoanBadgeStatus(row)} />
            ) : (
              (value as React.ReactNode)
            )
          }
          serverPagination={{ page, pageSize, total, onPageChange: setPage }}
        />
      )}
    </Card>
  );
}
