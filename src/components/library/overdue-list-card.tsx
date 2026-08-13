"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { ListErrorState } from "@/components/ui/list-error-state";
import { isApiError } from "@/lib/api/client";
import {
  searchOverdueLoans,
  type OverdueLoanSearchResult,
  type OverdueLoanSummary,
} from "@/lib/api/loans";
import { useDebouncedValue } from "@/lib/use-debounced-value";

export interface OverdueListCardProps {
  /** 페이지당 행 수. 기본 20 (디자인 원본 표시 단위 — `LoanHistoryCard`와 동일) */
  pageSize?: number;
  className?: string;
}

// 렌더마다 재생성되지 않도록 모듈 스코프. 폭 합계 100%.
// 디자인 원문 6컬럼(합 88%)의 비율을 보존해 100%로 재분배했다.
// `loan-table.ts`에 두지 않는 이유: 행 타입(OverdueLoanSummary)과 컬럼 집합이 달라
// 억지 일반화가 된다(그 파일 주석의 금지 사항). `RETURN_COLUMNS` 전례를 따른다.
// 두 번째 사용처가 생기면 그때 `library/overdue-table.ts`로 승격할 것.
const OVERDUE_LOAN_COLUMNS: DataTableColumn<OverdueLoanSummary>[] = [
  { key: "managementNumber", label: "관리번호", width: "15%", nowrap: true },
  { key: "bookTitle", label: "도서명", width: "27%" },
  { key: "borrowerName", label: "대출자", width: "12%" },
  { key: "department", label: "부서", width: "15%", secondary: true },
  { key: "dueDate", label: "반납예정일", width: "16%", secondary: true, nowrap: true },
  { key: "overdueDays", label: "경과 일수", width: "15%", nowrap: true },
];

/**
 * 연체 목록 카드. 부서 필터 · 조회 · 페이지 상태를 한 책임으로 묶는다.
 *
 * `LoanHistoryCard`와 카드를 합치지 않는다. 필터 필드 구성이 이질적이고(연체=텍스트 1개 /
 * 이력=텍스트 3개+select), 골격을 공유해봐야 남는 실체가 `Card` prop 조합과 클래스 문자열
 * 두 줄뿐이라 래퍼가 곧 제약이 된다(화면마다 다른 필터 레이아웃이 생기면 prop이 붙기 시작한다).
 * 조회 로직(디바운스 + 서버 페이지네이션 + settled 키 비교)도 훅으로 뽑지 않는다 — 화면마다
 * 파라미터 타입·필터 개수·`filterKey` 구성이 달라 제네릭 훅은 호출부가 직접 `useEffect`를
 * 쓰는 것과 코드량이 같고 디버깅만 어려워진다(`LoanHistoryCard`의 "상태 소유권 모델이 다르면
 * prop으로 합치지 않는다" 판단을 계승).
 *
 * **다만 이 조회 패턴은 이번이 5번째 복제다 — 6번째로 마주치면 `lib/use-server-list.ts`
 * 승격을 재검토할 것.**
 *
 * `/loans/overdue`는 연체 건만 내려주므로 상태 배지(`StatusBadge`)를 쓰지 않는다.
 * `overdueDays`는 서버 계산값이라 프론트에서 날짜로 재계산하지 않는다.
 */
export function OverdueListCard({
  pageSize = 20,
  className,
}: OverdueListCardProps) {
  const [department, setDepartment] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [retry, setRetry] = React.useState(0);

  // 마지막으로 완료된 요청. loading/error를 별도 state로 두고 effect 첫 줄에서
  // setState 하면 캐스케이딩 렌더가 되므로(react-hooks/set-state-in-effect),
  // "요청 키 vs 완료 키" 비교로 파생시킨다.
  const [settled, setSettled] = React.useState<{
    key: string;
    result: OverdueLoanSearchResult | null;
    error: string | null;
  }>({ key: "", result: null, error: null });

  const qDepartment = useDebouncedValue(department).trim();

  // 구분자 문자열을 쓰면 사용자가 그 문자를 입력했을 때 서로 다른 필터 조합이 같은 키로
  // 뭉개진다 — JSON 배열로 직렬화한다.
  const filterKey = JSON.stringify([qDepartment]);

  // 필터가 바뀌면 1페이지로 되돌린다(렌더 중 조정 — 이펙트로 하면 캐스케이딩 렌더가 된다).
  const [prevFilterKey, setPrevFilterKey] = React.useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const requestKey = `${filterKey}:${page}:${pageSize}:${retry}`;

  React.useEffect(() => {
    const controller = new AbortController();
    searchOverdueLoans(
      {
        // 빈 문자열은 `buildUrl`이 자동으로 누락시킨다.
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
  }, [qDepartment, page, pageSize, requestKey]);

  const loading = settled.key !== requestKey;
  const error = loading ? null : settled.error;
  const result = settled.result;
  const rows = result?.loans ?? [];
  const total = result?.pagination.totalElements ?? 0;

  const hasFilter = department !== "";

  // 페이지는 `filterKey` 변경으로 자동 리셋되므로 여기서 setPage를 부르지 않는다.
  function handleReset() {
    setDepartment("");
  }

  return (
    <div className={className}>
      <Card
        padding="sm"
        className="mb-5"
        role="search"
        aria-label="연체 목록 부서 검색"
      >
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Input
            aria-label="부서"
            placeholder="부서"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="sm:min-w-0 sm:flex-1"
          />
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
        title="연체 중인 도서"
        titleAs="h2"
        noPadding
        titleRight={
          <Badge variant="soft" tone="danger">
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
          <DataTable<OverdueLoanSummary>
            caption="연체 중인 도서 목록"
            columns={OVERDUE_LOAN_COLUMNS}
            rows={rows}
            loading={loading}
            emptyText="연체 중인 도서가 없습니다."
            renderCell={(col, value) =>
              col.key === "overdueDays" ? (
                // pill(`Badge`)은 이 코드베이스에서 상태 어휘 전용이다 — 수치를 같은 형태로
                // 그리면 상태 배지와 시각적으로 뭉개진다. 디자인 원문도 텍스트 강조다.
                <span className="text-base font-semibold text-danger">
                  {value as number}일 경과
                </span>
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
