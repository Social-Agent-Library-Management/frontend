"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input, inputVariants } from "@/components/ui/input";
import { ListErrorState } from "@/components/ui/list-error-state";
import { StatusBadge } from "@/components/library/status-badge";
import { LOAN_COLUMNS, toLoanBadgeStatus } from "@/components/library/loan-table";
import { isApiError } from "@/lib/api/client";
import {
  searchLoans,
  type LoanSearchResult,
  type LoanStatus,
  type LoanSummary,
} from "@/lib/api/loans";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";

export interface LoanHistoryCardProps {
  /** 페이지당 행 수. 기본 20 (디자인 원본 표시 단위) */
  pageSize?: number;
  className?: string;
}

/** `"ALL"`은 UI 전용 값이다 — 서버 `status` 파라미터는 생략으로 번역한다. */
type StatusFilter = "ALL" | LoanStatus;

/**
 * "연체"는 옵션에 없다. 서버 `status`는 `ON_LOAN`/`RETURNED` 두 값뿐이고 연체는 행별
 * 파생 불리언(`overdue`)이라, 서버 페이지네이션 위에서 클라이언트가 다시 걸러내면
 * 표시 건수가 서버가 말한 `pageSize`와 어긋난다. 대신 **행의 연체 배지는 그대로 뜬다**
 * (`toLoanBadgeStatus`가 `overdue`를 반영). 서버 `overdue` 필터는 후속 이슈 대상.
 */
const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "전체 상태" },
  { value: "ON_LOAN", label: "대출중" },
  { value: "RETURNED", label: "반납완료" },
];

/**
 * 대출 내역 조회 카드. 필터 · 조회 · 페이지 상태를 한 책임으로 묶는다.
 *
 * `LoanListCard`(현재 대출 현황)와 겸용하지 않는다 — 저쪽은 `status="ON_LOAN"` 고정이
 * 존재 이유이고 리셋 트리거를 부모가 소유하는 반면(`refreshToken`), 이 카드는 자기 필터가
 * 곧 리셋 트리거다. 상태 소유권 모델이 달라 prop으로 합치면 양쪽 다 읽기 어려워진다.
 * 진짜 중복인 컬럼 정의·배지 매핑만 `library/loan-table.ts`로 공유한다.
 *
 * 반납 완료 건까지 누적되는 이력 화면이라 `ReturnListCard`의 fetch-all + 클라이언트 필터
 * 패턴을 쓸 수 없다. 서버 필터 + `serverPagination`이다.
 */
export function LoanHistoryCard({
  pageSize = 20,
  className,
}: LoanHistoryCardProps) {
  const [bookTitle, setBookTitle] = React.useState("");
  const [borrowerName, setBorrowerName] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("ALL");
  const [page, setPage] = React.useState(1);
  const [retry, setRetry] = React.useState(0);

  // 마지막으로 완료된 요청. loading/error를 별도 state로 두고 effect 첫 줄에서
  // setState 하면 캐스케이딩 렌더가 되므로(react-hooks/set-state-in-effect),
  // `LoanListCard`와 동일한 "요청 키 vs 완료 키" 비교로 파생시킨다.
  const [settled, setSettled] = React.useState<{
    key: string;
    result: LoanSearchResult | null;
    error: string | null;
  }>({ key: "", result: null, error: null });

  // 텍스트 필터만 디바운스한다 — select는 이산적·의도적 조작이라 즉시 재조회한다.
  // 훅은 필드마다 한 번씩 호출한다. 객체 하나를 디바운스하면 매 렌더 새 참조가 생겨
  // 이펙트가 매번 재실행된다.
  const qBookTitle = useDebouncedValue(bookTitle).trim();
  const qBorrowerName = useDebouncedValue(borrowerName).trim();
  const qDepartment = useDebouncedValue(department).trim();

  // 구분자 문자열을 쓰면 사용자가 그 문자를 입력했을 때 서로 다른 필터 조합이 같은 키로
  // 뭉개진다 — JSON 배열로 직렬화한다.
  const filterKey = JSON.stringify([
    qBookTitle,
    qBorrowerName,
    qDepartment,
    status,
  ]);

  // 필터가 바뀌면 1페이지로 되돌린다(렌더 중 조정 — 이펙트로 하면 캐스케이딩 렌더가 된다).
  const [prevFilterKey, setPrevFilterKey] = React.useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const requestKey = `${filterKey}:${page}:${pageSize}:${retry}`;

  React.useEffect(() => {
    const controller = new AbortController();
    searchLoans(
      {
        // "ALL"은 서버에 보내지 않는다 — 파라미터 생략이 곧 전체 조회다.
        status: status === "ALL" ? undefined : status,
        // 빈 문자열은 `buildUrl`이 자동으로 누락시킨다.
        bookTitle: qBookTitle,
        borrowerName: qBorrowerName,
        department: qDepartment,
        page,
        pageSize,
      },
      controller.signal,
    )
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
  }, [
    qBookTitle,
    qBorrowerName,
    qDepartment,
    status,
    page,
    pageSize,
    requestKey,
  ]);

  const loading = settled.key !== requestKey;
  const error = loading ? null : settled.error;
  const result = settled.result;
  const rows = result?.loans ?? [];
  const total = result?.pagination.totalElements ?? 0;

  const hasFilter =
    bookTitle !== "" ||
    borrowerName !== "" ||
    department !== "" ||
    status !== "ALL";

  // 페이지는 `filterKey` 변경으로 자동 리셋되므로 여기서 setPage를 부르지 않는다.
  function handleReset() {
    setBookTitle("");
    setBorrowerName("");
    setDepartment("");
    setStatus("ALL");
  }

  return (
    <div className={className}>
      <Card
        padding="sm"
        className="mb-5"
        role="search"
        aria-label="대출 내역 검색"
      >
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Input
            aria-label="도서명"
            placeholder="도서명"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            className="sm:min-w-0 sm:flex-1"
          />
          <Input
            aria-label="대출자"
            placeholder="대출자 이름"
            value={borrowerName}
            onChange={(e) => setBorrowerName(e.target.value)}
            className="sm:min-w-0 sm:flex-1"
          />
          <Input
            aria-label="부서"
            placeholder="부서"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="sm:min-w-0 sm:flex-1"
          />
          {/*
            네이티브 <select>다. 코드베이스 첫 select라 `ui/select.tsx`로 승격하지 않고
            (1회용) `Input`의 `inputVariants`만 입혀 시각적 드리프트를 막는다 —
            `Combobox`가 자기 입력창에 쓰는 것과 같은 방식이다. 키보드·모바일 피커·
            스크린리더 지원은 네이티브 요소가 공짜로 준다.
            두 번째 사용처가 생기면 그때 프리미티브로 승격하고 이 인라인을 교체할 것.
          */}
          <select
            aria-label="상태"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className={cn(
              inputVariants({ invalid: false }),
              "w-full cursor-pointer sm:w-36",
            )}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            disabled={!hasFilter}
            onClick={handleReset}
          >
            초기화
          </Button>
        </div>
      </Card>

      <Card
        title="대출 내역"
        titleAs="h2"
        noPadding
        titleRight={
          <Badge variant="soft" tone="neutral">
            {total.toLocaleString()}건
          </Badge>
        }
      >
        {error ? (
          <ListErrorState
            message={error}
            onRetry={() => setRetry((n) => n + 1)}
          />
        ) : (
          <DataTable<LoanSummary>
            caption="대출 내역 목록"
            columns={LOAN_COLUMNS}
            rows={rows}
            loading={loading}
            emptyText="검색 결과가 없습니다."
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
    </div>
  );
}
