"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { isApiError } from "@/lib/api/client";
import { searchBooks, type BookListItem, type BookSearchResult } from "@/lib/api/books";

export interface BookListCardProps {
  /** 값이 바뀌면 1페이지로 되돌린 뒤 재조회한다 */
  refreshToken?: number;
  /** 페이지당 행 수. 기본 10 (API 기본값) */
  pageSize?: number;
  className?: string;
}

// 렌더마다 재생성되지 않도록 모듈 스코프에 둔다.
// 폭 합계 88%는 디자인 원본 그대로다 — `table-auto`가 잔여 폭을 분배한다.
const BOOK_COLUMNS: DataTableColumn<BookListItem>[] = [
  { key: "title", label: "도서명", width: "28%" },
  { key: "author", label: "저자", width: "14%" },
  { key: "publisher", label: "출판사", width: "16%", secondary: true },
  { key: "isbn", label: "ISBN", width: "20%", secondary: true, nowrap: true },
  { key: "bookItemCount", label: "소장본 수", width: "10%" },
];

/**
 * 등록된 도서 목록 카드. 조회·페이지 상태·로딩/에러를 한 책임으로 묶는다.
 *
 * 서버 페이지네이션이므로 `DataTable`의 `serverPagination`을 쓴다
 * (`Pagination`을 표 아래에 손으로 붙이지 않는다).
 */
export function BookListCard({
  refreshToken = 0,
  pageSize = 10,
  className,
}: BookListCardProps) {
  const [page, setPage] = React.useState(1);
  const [retry, setRetry] = React.useState(0);
  // 마지막으로 완료된 요청. loading/error를 별도 state로 두고 effect 첫 줄에서
  // setState 하면 캐스케이딩 렌더가 되므로(react-hooks/set-state-in-effect),
  // "요청 키 vs 완료 키" 비교로 파생시킨다. 동작(로딩 시작·에러 초기화)은 동일하다.
  const [settled, setSettled] = React.useState<{
    key: string;
    result: BookSearchResult | null;
    error: string | null;
  }>({ key: "", result: null, error: null });

  // refreshToken이 바뀌면 페이지를 1로 되돌린다.
  // useEffect 대신 렌더 중 조정 — DataTable이 이미 쓰는 패턴과 통일한다(캐스케이딩 렌더 방지).
  const [prevToken, setPrevToken] = React.useState(refreshToken);
  if (refreshToken !== prevToken) {
    setPrevToken(refreshToken);
    setPage(1);
  }

  const requestKey = `${page}:${pageSize}:${refreshToken}:${retry}`;

  React.useEffect(() => {
    const controller = new AbortController();
    searchBooks({ page, pageSize }, controller.signal)
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
  const rows = result?.books ?? [];
  const total = result?.pagination.totalElements ?? 0;

  return (
    <Card
      title="등록된 도서 목록"
      titleAs="h2"
      noPadding
      className={className}
      titleRight={
        <Badge variant="soft" tone="neutral">
          {total.toLocaleString()}건
        </Badge>
      }
    >
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
        <DataTable<BookListItem>
          caption="등록된 도서 목록"
          columns={BOOK_COLUMNS}
          rows={rows}
          loading={loading}
          renderCell={(col, value) =>
            col.key === "isbn" && (value === null || value === "")
              ? "—"
              : (value as React.ReactNode)
          }
          serverPagination={{ page, pageSize, total, onPageChange: setPage }}
        />
      )}
    </Card>
  );
}
