"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IconSearch } from "@/components/icons";
import { BookCopiesCard } from "@/components/library/book-copies-card";
import { BookSearchResultCard } from "@/components/library/book-search-result-card";
import type { BookListItem } from "@/lib/api/books";

export interface BookSearchSectionProps {
  /** 좌측 표의 페이지당 행 수. 기본 10 */
  pageSize?: number;
  className?: string;
}

/**
 * 도서 검색 화면의 배선 계층. 검색바 + 결과 카드 + 소장본 카드를 묶는다.
 *
 * **페이지에서 검색바·두 카드를 직접 배치하지 말 것** — `search`/`selected` 배선을
 * 손으로 하지 않는다. 검색어가 바뀌면 선택이 무효가 되는 규칙이 여기 한 곳에만 있다.
 *
 * 좌우 카드를 한 컴포넌트로 합치지 않는다 — 각자 독립된 비동기 작업(`searchBooks` +
 * 페이지 상태 / `getBook`)을 가져서, 합치면 `settled` 2벌·이펙트 2벌이 한 파일에 쌓인다.
 * 공유 상태만 얇은 Section이 소유하는 형태는 `BookRegisterSection` 선례와 같다.
 */
export function BookSearchSection({
  pageSize,
  className,
}: BookSearchSectionProps) {
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<BookListItem | null>(null);

  // 검색어와 선택 중 하나라도 있으면 초기화가 의미를 갖는다(둘 다 지우므로 OR).
  // `search`는 디바운스 전 원본을 본다 — 입력 즉시 버튼이 살아나야 한다.
  const canReset = search !== "" || selected !== null;

  function handleReset() {
    setSearch("");
    setSelected(null);
  }

  return (
    <div className={className}>
      <Card padding="sm" className="mb-5" role="search" aria-label="도서 검색">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Input
            aria-label="도서명, 저자, 출판사, ISBN 검색"
            placeholder="도서명, 저자, 출판사, ISBN 검색"
            leadingIcon={<IconSearch size={16} />}
            value={search}
            onChange={(e) => {
              // 검색어가 바뀌면 이전 선택은 즉시 무효다(원본 디자인 동작).
              setSearch(e.target.value);
              setSelected(null);
            }}
            className="sm:min-w-0 sm:flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            disabled={!canReset}
            onClick={handleReset}
          >
            초기화
          </Button>
        </div>
      </Card>

      {/* 1회용 2단 레이아웃. flex-basis/grow는 각 카드가 자기 기본 className으로 소유한다. */}
      <div className="flex flex-wrap gap-5">
        <BookSearchResultCard
          query={search}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          pageSize={pageSize}
        />
        <BookCopiesCard book={selected} />
      </div>
    </div>
  );
}
