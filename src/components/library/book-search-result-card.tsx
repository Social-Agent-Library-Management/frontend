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
  /** 서버가 내려준 오타 교정 후보. 최대 3개, 항상 1개 이상(빈 배열이면 `null`로 올린다). */
  suggestions: string[];
  /** 현재 페이지에 결과 행이 있는지 — 배너 문구 분기에만 쓴다. */
  hasResults: boolean;
};

const NO_SUGGESTIONS: string[] = [];

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
  /**
   * 검색 응답이 도착한 순간, 결과 첫 행을 알린다. **1페이지 && 검색어 있음 && 결과 있음 && 최신 입력이 요청 검색어와 같음**일 때만.
   *
   * 응답 시점의 이벤트다 — `selectedId === null && rows[0]` 같은 이펙트로 파생하지 않는다.
   * 타이핑 중에는 부모가 선택을 비우지만 `rows`는 아직 이전 검색어의 것이라, 이펙트로 하면
   * 이전 검색어의 첫 행이 즉시 재선택된다. 빈 검색어(전체 목록)는 검색이 아니라 부르지 않는다.
   * 사용자 선택을 덮을지는 부모가 정한다(`BookSearchSection`은 사용자 클릭을 우선한다).
   */
  onAutoSelect?: (book: BookListItem) => void;
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
 * 검색 응답의 첫 행은 `onAutoSelect`로 올려 보낼 뿐, 선택 여부는 부모가 정한다.
 */
export function BookSearchResultCard({
  query,
  selectedId,
  onSelect,
  onSuggestionChange,
  onAutoSelect,
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

  // 콜백은 ref에 담아 조회 이펙트의 deps에서 제외한다(`Toast`/`Combobox`와 동일) —
  // 호출부가 인라인 함수를 넘겨도 재조회가 일어나지 않게.
  const onAutoSelectRef = React.useRef(onAutoSelect);
  // 디바운스 전 최신 입력. abort는 디바운스된 `q`가 바뀔 때만 일어나므로, 대기 중에
  // 도착한 이전 검색어 응답이 타이핑·초기화 직후 자동 선택하지 않도록 비교에 쓴다.
  const latestQueryRef = React.useRef(query);
  React.useEffect(() => {
    onAutoSelectRef.current = onAutoSelect;
    latestQueryRef.current = query;
  }, [onAutoSelect, query]);

  React.useEffect(() => {
    const controller = new AbortController();
    // 빈 문자열은 `buildUrl`이 자동으로 누락시킨다(= 전체 조회).
    searchBooks({ q, page, pageSize }, controller.signal)
      .then((data) => {
        setSettled({ key: requestKey, result: data, error: null });
        // 자동 선택은 응답 도착 시점에만 — 규칙은 `onAutoSelect` JSDoc 참조.
        const first = data.books[0];
        if (
          page === 1 &&
          q !== "" &&
          first &&
          latestQueryRef.current.trim() === q
        )
          onAutoSelectRef.current?.(first);
      })
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
  // 트리거는 `suggestions` 배열이 비어있는지 하나뿐이다 — 서버가 이미 "오타로 판단되는지"를
  // 결정해 내려주므로(`exactSubstringHits == 0`), 결과 건수(`total`/`pagination.totalElements`)로
  // 다시 게이팅하지 않는다. 서버 코멘트도 "결과 건수와 무관하게 내려간다"고 명시한다 —
  // 즉 검색 결과가 있어도(느슨한 매칭으로 몇 건이 나와도) 오타 제안은 별개로 뜰 수 있다.
  // 에러 시에는 `result`가 직전 성공 응답을 그대로 들고 있어(아래 catch 참조) 오래된
  // 제안이 뜰 수 있으므로 `!error`로 막는다.
  // 배포 시차로 필드가 `undefined`여도 빈 배열로 수렴시킨다. 폴백은 모듈 상수여야 한다 —
  // `[]` 리터럴은 매 렌더 새 참조라 아래 이펙트가 매번 재실행된다.
  const suggestions =
    (!error && result ? result.suggestions : undefined) ?? NO_SUGGESTIONS;

  // 배너는 이 카드가 렌더하지 않는다(디자인상 검색바 카드 소속) — 파생값만 부모에 올린다.
  // `onSuggestionChange`가 매 렌더 새 함수면 이펙트가 매번 재실행되지만, 부모가
  // `useState` setter(참조 안정)를 그대로 넘기는 한 문제 없다 — 새 함수를 넘기려면
  // 호출부가 `useCallback`으로 감싸야 한다.
  React.useEffect(() => {
    onSuggestionChange?.(
      suggestions.length > 0
        ? { query: q, suggestions, hasResults: rows.length > 0 }
        : null,
    );
  }, [q, suggestions, rows.length, onSuggestionChange]);

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
