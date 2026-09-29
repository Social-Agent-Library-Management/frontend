"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IconSearch } from "@/components/icons";
import { BookCopiesCard } from "@/components/library/book-copies-card";
import {
  BookSearchResultCard,
  type SuggestionInfo,
} from "@/components/library/book-search-result-card";
import type { BookListItem } from "@/lib/api/books";
import { withEun, withEuro } from "@/lib/korean-particle";

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
  // 배너는 이 섹션의 검색바 카드 안에서 렌더한다(디자인 배치) — 실제 파생은
  // `BookSearchResultCard`가 소유하고 이펙트로 여기 올려준다.
  const [suggestionInfo, setSuggestionInfo] =
    React.useState<SuggestionInfo | null>(null);

  // 검색어와 선택 중 하나라도 있으면 초기화가 의미를 갖는다(둘 다 지우므로 OR).
  // `search`는 디바운스 전 원본을 본다 — 입력 즉시 버튼이 살아나야 한다.
  const canReset = search !== "" || selected !== null;

  /**
   * 검색어를 바꾼다. **검색어가 바뀌면 이전 선택은 즉시 무효**라는 규칙이
   * 이 함수 한 곳에만 있다(원본 디자인 동작) — 호출부에서 `setSelected(null)`을
   * 손으로 하지 말 것. 입력·초기화·오타 교정 재검색 세 경로가 전부 여기를 지난다.
   */
  function applySearch(term: string) {
    setSearch(term);
    setSelected(null);
  }

  return (
    <div className={className}>
      <Card padding="sm" className="mb-5" role="search" aria-label="도서 검색">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Input
            aria-label="도서명, 저자 검색"
            placeholder="도서명, 저자 검색"
            leadingIcon={<IconSearch size={16} />}
            value={search}
            onChange={(e) => applySearch(e.target.value)}
            className="sm:min-w-0 sm:flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            disabled={!canReset}
            onClick={() => applySearch("")}
          >
            초기화
          </Button>
        </div>
        {suggestionInfo ? (
          <SuggestionBanner info={suggestionInfo} onSearch={applySearch} />
        ) : null}
      </Card>

      {/* 1회용 2단 레이아웃. flex-basis/grow는 각 카드가 자기 기본 className으로 소유한다. */}
      <div className="flex flex-wrap gap-5">
        <BookSearchResultCard
          query={search}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          onSuggestionChange={setSuggestionInfo}
          pageSize={pageSize}
        />
        <BookCopiesCard book={selected} />
      </div>
    </div>
  );
}

interface SuggestionBannerProps {
  info: SuggestionInfo;
  onSearch: (term: string) => void;
}

/**
 * 서버 오타 교정 제안 배너(`#29`, `#43`). 결과 유무와 무관하게 뜬다 —
 * `BookSearchResultCard`가 이펙트로 올려준 `SuggestionInfo`를 그대로 그린다.
 *
 * **`ui/`로 올리지 않는다** — 소비자가 이 파일 하나뿐이고 문구가 도서 검색 도메인
 * 전용이다(`ui/pagination.tsx`의 내부 `PageButton`과 같은 취급).
 *
 * 검색바 카드 안, 입력 행 바로 아래에 렌더한다(디자인 배치) — 구분선을 넣지 않는다.
 */
function SuggestionBanner({ info, onSearch }: SuggestionBannerProps) {
  const { query, suggestions, hasResults } = info;
  return (
    // 카드 안에 조작 가능한 요소(링크)가 새로 나타나므로 등장을 알린다
    // (상태를 알리는 `ListErrorState`와 동일한 선례).
    <p role="status" className="mt-2.5 text-base leading-cozy text-fg-muted">
      {/* ⚠️ text-primary가 아니다 — 그건 브랜드 파랑이다. 강조 텍스트는 text-fg. */}
      <strong className="font-semibold text-fg">{`"${query}"`}</strong>
      {hasResults
        ? // 조사가 따옴표 **밖**에 와야 해서 withEun이 돌려준 전체 문자열에서
          // 조사 부분만 떼어낸다(아래 withEuro와 동일 기법).
          `${withEun(query).slice(query.length)} 오타일 수 있어요.`
        : "에 대한 검색 결과가 없습니다."}{" "}
      {/* 서버가 최대 3개까지 후보를 내려준다 — 후보마다 받침에 맞는 조사가
          달라질 수 있어(withEuro) 버튼마다 개별 계산한다. */}
      {suggestions.map((suggestion, i) => (
        // 서버가 같은 후보를 두 번 내려도 key가 겹치지 않게 인덱스를 섞는다.
        <React.Fragment key={`${i}-${suggestion}`}>
          {i > 0 ? " / " : ""}
          <button
            type="button"
            className="cursor-pointer font-semibold text-primary hover:underline"
            onClick={() => onSearch(suggestion)}
          >
            {`"${suggestion}"`}
            {withEuro(suggestion).slice(suggestion.length)} 검색
          </button>
        </React.Fragment>
      ))}
    </p>
  );
}
