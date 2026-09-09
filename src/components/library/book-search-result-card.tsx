"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ListErrorState } from "@/components/ui/list-error-state";
import { BOOK_COLUMNS } from "@/components/library/book-table";
import { isApiError } from "@/lib/api/client";
import {
  searchBooks,
  type BookListItem,
  type BookSearchResult,
} from "@/lib/api/books";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";

/** 오타 교정 제안 배너(`BookSearchSection`)를 채우는 정보. 제안이 없으면 `null`. */
export type SuggestionInfo = {
  /** 검색어(디바운스 후, 트림됨) — 배너 문구에 쓴다. */
  query: string;
  suggestion: string;
  /** 현재 페이지에 결과 행이 있는지 — 배너 문구 분기에만 쓴다. */
  hasResults: boolean;
};

export interface BookSearchResultCardProps {
  /** 검색어 **원본**(디바운스 전). 지연은 이 카드가 `useDebouncedValue`로 처리한다. */
  query: string;
  /** 현재 선택된 도서 id. null = 미선택. 선택 행의 도서명 강조에만 쓴다. */
  selectedId: number | null;
  /** 행 클릭 — 선택 상태는 부모(`BookSearchSection`)가 소유한다 */
  onSelect: (book: BookListItem) => void;
  /**
   * 오타 교정 제안 정보가 바뀔 때마다 알린다(제안이 없으면 `null`).
   *
   * 배너 자체는 `BookSearchSection`의 검색바 카드 안에 렌더된다(디자인 배치) — 이 카드는
   * `noPadding` 결과 카드라 배너가 들어갈 자리가 다르다. 그래서 배너를 렌더하는 대신
   * 파생값만 이펙트로 부모에 올린다. `selectedId`와 반대 방향이지만 같은 이유(소유권 분리)다.
   */
  onSuggestionChange?: (info: SuggestionInfo | null) => void;
  /** 페이지당 행 수. 기본 20(`ReturnListCard`/`LoanHistoryCard`와 통일) */
  pageSize?: number;
  className?: string;
}

/**
 * 도서 검색 결과 카드. 조회·페이지 상태·로딩/에러를 한 책임으로 묶는다.
 *
 * `BookListCard`(`#7`)와 겸용하지 않는다 — 저쪽은 검색어도 행 클릭도 선택도 없고
 * 리셋 트리거를 부모가 `refreshToken`으로 소유한다. prop 3개를 얹으면 두 계약이 충돌한다.
 * 컬럼 정의는 `library/book-table.ts`의 `BOOK_COLUMNS`를 공유한다(ISBN 미노출).
 *
 * 선택 상태는 소유하지 않는다 — `selectedId`를 받아 강조만 한다.
 * 페이지를 넘겨도 선택은 유지된다(우측 패널은 행 위치가 아니라 도서 id로 조회한다).
 */
export function BookSearchResultCard({
  query,
  selectedId,
  onSelect,
  onSuggestionChange,
  pageSize = 20,
  className,
}: BookSearchResultCardProps) {
  const [page, setPage] = React.useState(1);
  const [retry, setRetry] = React.useState(0);
  // "요청 키 vs 완료 키" 비교로 loading/error를 파생시킨다(`LoanHistoryCard`와 동일).
  const [settled, setSettled] = React.useState<{
    key: string;
    result: BookSearchResult | null;
    error: string | null;
  }>({ key: "", result: null, error: null });

  // 디바운스를 여기 인라인하지 않는다 — 지연 시간이 화면마다 갈라진다.
  const q = useDebouncedValue(query).trim();

  // 검색어가 바뀌면 1페이지로 되돌린다(렌더 중 조정 — 이펙트로 하면 캐스케이딩 렌더가 된다).
  const [prevQuery, setPrevQuery] = React.useState(q);
  if (q !== prevQuery) {
    setPrevQuery(q);
    setPage(1);
  }

  // 구분자 문자열을 쓰면 사용자가 그 문자를 입력했을 때 서로 다른 요청이 같은 키로
  // 뭉개진다 — JSON 배열로 직렬화한다.
  const requestKey = JSON.stringify([q, page, pageSize, retry]);

  React.useEffect(() => {
    const controller = new AbortController();
    // 빈 문자열은 `buildUrl`이 자동으로 누락시킨다(= 전체 조회).
    searchBooks({ q, page, pageSize }, controller.signal)
      .then((data) => setSettled({ key: requestKey, result: data, error: null }))
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
  // 트리거는 `suggestion` 존재 여부 하나뿐이다 — 서버가 이미 "오타로 판단되는지"를
  // 결정해 내려주므로(`exactSubstringHits == 0`), 결과 건수(`total`/`pagination.totalElements`)로
  // 다시 게이팅하지 않는다. 서버 코멘트도 "결과 건수와 무관하게 내려간다"고 명시한다 —
  // 즉 검색 결과가 있어도(느슨한 매칭으로 몇 건이 나와도) 오타 제안은 별개로 뜰 수 있다.
  // 에러 시에는 `result`가 직전 성공 응답을 그대로 들고 있어(아래 catch 참조) 오래된
  // 제안이 뜰 수 있으므로 `!error`로 막는다.
  const suggestion = !error && result ? result.suggestion : null;

  // 배너는 이 카드가 렌더하지 않는다(디자인상 검색바 카드 소속) — 파생값만 부모에 올린다.
  // `onSuggestionChange`가 매 렌더 새 함수면 이펙트가 매번 재실행되지만, 부모가
  // `useState` setter(참조 안정)를 그대로 넘기는 한 문제 없다 — 새 함수를 넘기려면
  // 호출부가 `useCallback`으로 감싸야 한다.
  React.useEffect(() => {
    onSuggestionChange?.(
      suggestion ? { query: q, suggestion, hasResults: rows.length > 0 } : null,
    );
  }, [q, suggestion, rows.length, onSuggestionChange]);

  return (
    <Card
      title="검색 결과"
      titleAs="h2"
      noPadding
      className={cn("min-w-0 grow-2 basis-130", className)}
      titleRight={
        <Badge variant="soft" tone="neutral">
          {total.toLocaleString()}건
        </Badge>
      }
    >
      {error ? (
        <ListErrorState message={error} onRetry={() => setRetry((n) => n + 1)} />
      ) : (
        <DataTable<BookListItem>
          caption="도서 검색 결과"
          columns={BOOK_COLUMNS}
          rows={rows}
          loading={loading}
          emptyText="검색 결과가 없습니다."
          onRowClick={(row) => onSelect(row)}
          renderCell={(col, value, row) => {
            if (col.key === "title" && row.id === selectedId) {
              return (
                <span className="font-semibold text-primary">
                  {row.title}
                  {/* 색·굵기만으로는 선택이 스크린리더에 전달되지 않는다.
                      행이 이미 role="button"이라 aria-selected는 유효하지 않다. */}
                  <span className="sr-only"> (선택됨)</span>
                </span>
              );
            }
            return value as React.ReactNode;
          }}
          serverPagination={{ page, pageSize, total, onPageChange: setPage }}
        />
      )}
    </Card>
  );
}
