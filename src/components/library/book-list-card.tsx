"use client";

import * as React from "react";

import { IconSearch } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { ListErrorState } from "@/components/ui/list-error-state";
import { BOOK_COLUMNS, formatIsbn } from "@/components/library/book-table";
import { isApiError } from "@/lib/api/client";
import { searchBooks, type BookListItem, type BookSearchResult } from "@/lib/api/books";
import { useDebouncedValue } from "@/lib/use-debounced-value";

export interface BookListCardProps {
  /** 값이 바뀌면 1페이지로 되돌린 뒤 재조회한다 */
  refreshToken?: number;
  /** 페이지당 행 수. 기본 20(`ReturnListCard`/`LoanHistoryCard`와 통일) */
  pageSize?: number;
  className?: string;
}

/**
 * 등록된 도서 목록 카드. 조회·페이지 상태·로딩/에러를 한 책임으로 묶는다.
 *
 * 서버 페이지네이션이므로 `DataTable`의 `serverPagination`을 쓴다
 * (`Pagination`을 표 아래에 손으로 붙이지 않는다).
 *
 * 검색어는 이 카드가 **자체 소유**한다 — 부모 `BookRegisterSection`은 `refreshToken`만
 * 소유한다(`CopyListCard`와 같은 구조). 검색어가 공유 상태가 아니므로 끌어올리지 않으며,
 * 그 덕에 등록 성공(`refreshToken` 변경) 시 검색어를 유지하는 데 코드가 필요 없다.
 */
export function BookListCard({
  refreshToken = 0,
  pageSize = 20,
  className,
}: BookListCardProps) {
  const [query, setQuery] = React.useState("");
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

  // 디바운스는 lib 훅에 위임한다 — 컴포넌트에 다시 인라인하지 말 것.
  // trim은 디바운스 **후** 한 번만 한다(입력 중 공백을 지우면 안 되므로 query는 그대로 둔다).
  const q = useDebouncedValue(query).trim();

  // 검색어 변경과 refreshToken 변경을 하나의 키로 묶어 렌더 중 조정으로 1페이지 리셋한다.
  // 리셋 규칙을 두 블록으로 나누지 않는다 — 갈라지면 트리거가 늘 때마다 어디에 넣을지 헷갈린다.
  // useEffect 대신 렌더 중 조정 — 캐스케이딩 렌더(잘못된 페이지가 한 번 그려짐)를 막는다.
  // retry는 넣지 않는다 — 재시도는 보던 페이지를 유지해야 한다.
  const pageResetKey = JSON.stringify([q, refreshToken]);
  const [prevPageResetKey, setPrevPageResetKey] = React.useState(pageResetKey);
  if (pageResetKey !== prevPageResetKey) {
    setPrevPageResetKey(pageResetKey);
    setPage(1);
  }

  // 구분자 문자열 대신 JSON 배열로 직렬화한다 — 사용자가 ':'를 입력하면 서로 다른
  // 요청이 같은 키로 뭉개진다(`CopyListCard`·`BookSearchResultCard` 선례).
  const requestKey = JSON.stringify([q, page, pageSize, refreshToken, retry]);

  React.useEffect(() => {
    const controller = new AbortController();
    // 빈 문자열은 buildUrl이 자동으로 누락시킨다(= 전체 조회).
    searchBooks({ q, page, pageSize }, controller.signal)
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
  }, [q, page, pageSize, requestKey]);

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
      {/* 디자인 원본처럼 목록 카드 헤더 아래 구분선 안에 검색을 둔다 — 별도 Card로 빼지 않는다.
          클래스 문자열은 `CopyListCard`와 글자 그대로 같게 유지할 것 — 세 번째 사용처가
          생기면 검색 전용 래퍼가 아니라 `Card`의 하위 파트로 한 번에 승격한다. */}
      <div className="border-b border-line px-5 py-3.5">
        <Input
          aria-label="도서명, 저자, 출판사 또는 ISBN으로 검색"
          placeholder="도서명, 저자, 출판사 또는 ISBN으로 검색"
          leadingIcon={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </div>

      {error ? (
        <ListErrorState message={error} onRetry={() => setRetry((n) => n + 1)} />
      ) : (
        <DataTable<BookListItem>
          caption="등록된 도서 목록"
          columns={BOOK_COLUMNS}
          rows={rows}
          loading={loading}
          emptyText="검색 결과가 없습니다."
          renderCell={(col, value, row) =>
            col.key === "isbn"
              ? formatIsbn(row.isbn)
              : (value as React.ReactNode)
          }
          serverPagination={{ page, pageSize, total, onPageChange: setPage }}
        />
      )}
    </Card>
  );
}
