"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Toast, type ToastTone } from "@/components/ui/toast";
import { StatusBadge } from "@/components/library/status-badge";
import { toLoanBadgeStatus } from "@/components/library/loan-table";
import { isApiError } from "@/lib/api/client";
import {
  returnLoan,
  searchLoans,
  LOAN_NOT_ON_LOAN_CODE,
  type LoanSearchResult,
  type LoanSummary,
} from "@/lib/api/loans";

export interface ReturnListCardProps {
  className?: string;
}

// 렌더마다 재생성되지 않도록 모듈 스코프에 둔다.
// 마지막 컬럼(loanId)은 화면에 관리번호를 다시 보여주지 않는다 — renderCell이 항상
// 액션 버튼으로 덮어쓰는 자리 표시자 키다. LoanSummary에 실제 "액션" 필드가 없어
// DataTableColumn<T>의 `key: keyof T` 제약을 만족하려면 실존 키를 빌려야 한다.
const RETURN_COLUMNS: DataTableColumn<LoanSummary>[] = [
  { key: "managementNumber", label: "관리번호", width: "13%", nowrap: true },
  { key: "bookTitle", label: "도서명", width: "24%" },
  { key: "borrowerName", label: "대출자", width: "11%" },
  { key: "department", label: "부서", width: "12%", secondary: true },
  { key: "dueDate", label: "반납예정일", width: "13%", secondary: true, nowrap: true },
  { key: "status", label: "상태", width: "10%" },
  { key: "loanId", label: "", width: "17%" },
];

/**
 * 목록 화면 기준 최대 동시 대출 건수. 서버 `PageRequestParams.MAX_PAGE_SIZE`와 같다.
 * 검색이 클라이언트 필터링이라(아래 주석 참조) 대출 중 전체를 한 번에 받아야 한다.
 */
const FETCH_PAGE_SIZE = 100;
/** 디자인 원본과 동일한 표시 페이지 크기(클라이언트 페이지네이션) */
const DISPLAY_PAGE_SIZE = 20;

function matchesSearch(row: LoanSummary, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    row.managementNumber.toLowerCase().includes(q) ||
    row.bookTitle.toLowerCase().includes(q) ||
    row.borrowerName.toLowerCase().includes(q)
  );
}

type ToastState = { open: boolean; tone: ToastTone; message: string };

const CLOSED_TOAST: ToastState = { open: false, tone: "success", message: "" };

/**
 * 반납 처리 대상 카드. 대출 중(ON_LOAN)인 소장본을 검색·조회하고, 행별로 반납 처리한다.
 *
 * 백엔드 `/loans` 검색은 `bookTitle`/`borrowerName`/`department`만 지원하고
 * 관리번호 필터가 없다(`LoanRepository.search`). 디자인 원본은 관리번호·도서명·대출자를
 * 하나의 검색창에서 함께 훑으므로, ON_LOAN 전체(최대 `FETCH_PAGE_SIZE`건)를 받아
 * 클라이언트에서 세 필드를 함께 검색한다 — 원본 프로토타입의 배열 필터와 동일한 동작이다.
 *
 * 반납 성공 시 디자인 원본처럼 행에 "처리완료"를 낙관적으로 표시하지 않고 목록을
 * 재조회한다 — 이 코드베이스는 서버가 확정한 상태만 신뢰한다(`LoanListCard` 참고).
 * 재조회하면 반납된 건은 ON_LOAN 필터에서 자연히 빠진다.
 */
export function ReturnListCard({ className }: ReturnListCardProps) {
  const [search, setSearch] = React.useState("");
  const [fetchToken, setFetchToken] = React.useState(0);
  const [retry, setRetry] = React.useState(0);
  const [processingIds, setProcessingIds] = React.useState<Set<number>>(
    () => new Set(),
  );
  const [toast, setToast] = React.useState<ToastState>(CLOSED_TOAST);

  // "요청 키 vs 완료 키" 비교로 loading을 파생시킨다(캐스케이딩 렌더 방지 — LoanListCard와 동일 패턴).
  const [settled, setSettled] = React.useState<{
    key: string;
    result: LoanSearchResult | null;
    error: string | null;
  }>({ key: "", result: null, error: null });

  const requestKey = `${fetchToken}:${retry}`;

  React.useEffect(() => {
    const controller = new AbortController();
    searchLoans(
      { status: "ON_LOAN", page: 1, pageSize: FETCH_PAGE_SIZE },
      controller.signal,
    )
      .then((data) =>
        setSettled({ key: requestKey, result: data, error: null }),
      )
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setSettled((prev) => ({
          key: requestKey,
          result: prev.result,
          error: isApiError(e) ? e.detail : "목록을 불러오지 못했습니다.",
        }));
      });
    return () => controller.abort();
  }, [requestKey]);

  const loading = settled.key !== requestKey;
  const error = loading ? null : settled.error;
  const rows = React.useMemo(
    () => (settled.result?.loans ?? []).filter((row) => matchesSearch(row, search)),
    [settled.result, search],
  );

  async function handleReturn(row: LoanSummary) {
    setProcessingIds((prev) => new Set(prev).add(row.loanId));
    try {
      await returnLoan(row.loanId);
      setToast({
        open: true,
        tone: "success",
        message: `"${row.bookTitle}" 반납 처리되었습니다.`,
      });
      setFetchToken((t) => t + 1);
    } catch (e) {
      // LOAN_NOT_ON_LOAN은 다른 창에서 먼저 처리된 경합 — 목록을 새로고침해 최신 상태로 맞춘다.
      if (isApiError(e) && e.code === LOAN_NOT_ON_LOAN_CODE) {
        setFetchToken((t) => t + 1);
      }
      setToast({
        open: true,
        tone: "danger",
        message: isApiError(e)
          ? e.detail
          : "반납 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(row.loanId);
        return next;
      });
    }
  }

  return (
    <div className={className}>
      <Card padding="sm" className="mb-5">
        <Input
          aria-label="검색"
          placeholder="관리번호, 도서명 또는 대출자 이름으로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <Card title="반납 처리 대상" titleAs="h2" noPadding>
        {error ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="text-body leading-normal text-fg-muted">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRetry((n) => n + 1)}
            >
              다시 시도
            </Button>
          </div>
        ) : (
          <DataTable<LoanSummary>
            caption="반납 처리 대상 목록"
            columns={RETURN_COLUMNS}
            rows={rows}
            loading={loading}
            emptyText="대출 중인 소장본이 없습니다."
            pageSize={DISPLAY_PAGE_SIZE}
            renderCell={(col, value, row) => {
              if (col.key === "status") {
                // 이 목록은 ON_LOAN만 조회하므로 3-state 매핑도 결과가 동일하다
                // (`RETURNED` 분기에 걸리는 행이 없다).
                return <StatusBadge status={toLoanBadgeStatus(row)} />;
              }
              if (col.key === "loanId") {
                const processing = processingIds.has(row.loanId);
                return (
                  <Button
                    variant="success"
                    size="sm"
                    disabled={processing}
                    aria-busy={processing}
                    onClick={() => handleReturn(row)}
                  >
                    {processing ? "처리 중…" : "반납 처리"}
                  </Button>
                );
              }
              return value as React.ReactNode;
            }}
          />
        )}
      </Card>

      <Toast
        open={toast.open}
        tone={toast.tone}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
