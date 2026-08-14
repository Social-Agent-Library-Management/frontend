"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ListErrorState } from "@/components/ui/list-error-state";
import { StatusBadge } from "@/components/library/status-badge";
import {
  BOOK_ITEM_COLUMNS,
  formatIsbn,
  toBookItemBadgeStatus,
} from "@/components/library/book-table";
import { isApiError } from "@/lib/api/client";
import {
  getBook,
  type BookDetail,
  type BookItemSummary,
  type BookListItem,
} from "@/lib/api/books";
import { cn } from "@/lib/utils";

export interface BookCopiesCardProps {
  /**
   * 좌측에서 선택된 도서. null이면 안내 문구만 렌더한다.
   *
   * **`id`뿐 아니라 객체 전체를 받는다** — 제목·저자·출판사·ISBN이 여기에 이미 있어
   * 상세 조회를 기다리지 않고 헤더와 메타 행을 즉시 그릴 수 있다.
   * `getBook()`이 필요한 것은 `bookItems` 하나뿐이다.
   */
  book: BookListItem | null;
  className?: string;
}

/**
 * 선택된 도서의 소장본 목록 카드.
 *
 * 스피너·스켈레톤을 만들지 않는다 — 비동기로 채워지는 건 표뿐이고, 그 로딩 표시는
 * `DataTable`의 `loading`이 이미 갖고 있다(행 0 → 문구).
 *
 * 조회 실패는 `ListErrorState`다(`Toast`는 이 코드베이스에서 쓰기 결과 전용).
 * 404는 몇 번을 눌러도 결과가 같으므로 `onRetry`를 넘기지 않는다.
 *
 * 상세를 캐시하지 않는다 — 소장본 상태는 다른 사용자의 대출·반납으로 수시로 바뀐다.
 * 다만 요청 키가 `[bookId, retry]`라 같은 행을 다시 클릭하면 이펙트가 재실행되지 않는다.
 */
export function BookCopiesCard({ book, className }: BookCopiesCardProps) {
  const [retry, setRetry] = React.useState(0);
  // 마지막으로 완료된 요청. loading/error를 별도 state로 두고 effect 첫 줄에서
  // setState 하면 캐스케이딩 렌더가 되므로(react-hooks/set-state-in-effect),
  // 코드베이스 공통의 "요청 키 vs 완료 키" 비교로 파생시킨다.
  const [settled, setSettled] = React.useState<{
    key: string;
    detail: BookDetail | null;
    error: { message: string; retryable: boolean } | null;
  }>({ key: "", detail: null, error: null });

  const bookId = book?.id ?? null;
  const requestKey = bookId === null ? "" : JSON.stringify([bookId, retry]);

  React.useEffect(() => {
    if (bookId === null) return;

    const controller = new AbortController();
    getBook(bookId, controller.signal)
      .then((data) => setSettled({ key: requestKey, detail: data, error: null }))
      .catch((e: unknown) => {
        // 경합/언마운트 취소는 무시한다.
        if (controller.signal.aborted) return;
        setSettled({
          key: requestKey,
          // 이전 도서의 소장본이 에러 화면 뒤에 남지 않도록 비운다.
          detail: null,
          error: {
            message: isApiError(e)
              ? e.detail
              : "소장본 목록을 불러오지 못했습니다.",
            // 404(삭제된 도서)는 재시도해도 결과가 같다.
            retryable: !(isApiError(e) && e.status === 404),
          },
        });
      });
    return () => controller.abort();
  }, [bookId, requestKey]);

  // 완료된 요청이 "지금 보고 있는 도서"의 것일 때만 결과를 채택한다.
  // `!loading`으로 파생시키면 선택 해제(초기화) 직후 `loading`이 false라
  // 직전 도서의 상세가 그대로 남아 안내 문구 옆에 낡은 건수 배지가 뜬다.
  const settledMatchesRequest = bookId !== null && settled.key === requestKey;
  const loading = bookId !== null && !settledMatchesRequest;
  // 로딩 중·미선택에는 직전 도서의 결과를 보여주지 않는다(다른 도서의 소장본 유출 방지).
  const error = settledMatchesRequest ? settled.error : null;
  const detail = settledMatchesRequest ? settled.detail : null;

  return (
    <Card
      title={book ? `소장본 · ${book.title}` : "소장본 목록"}
      titleAs="h2"
      noPadding
      className={cn("min-w-0 grow basis-100", className)}
      // 건수 배지와 바로 아래 표의 행 수는 항상 같은 출처여야 한다 —
      // `book.bookItemCount`로 미리 채우면 로딩이 끝나는 순간 숫자가 튄다.
      titleRight={
        detail ? (
          <Badge variant="soft" tone="copy">
            {detail.bookItems.length.toLocaleString()}권
          </Badge>
        ) : null
      }
    >
      {book === null ? (
        <p className="px-6 py-14 text-center text-body text-fg-muted">
          왼쪽 목록에서 도서를 선택하세요.
        </p>
      ) : (
        <>
          {/* 라벨-값 쌍이므로 <span>+<b>가 아니라 <dl>이다 — 스크린리더가 "저자: 값"으로 읽는다. */}
          <dl className="flex flex-wrap gap-5 border-b border-line px-5 py-3 text-base leading-cozy text-fg-muted">
            <div className="flex gap-1.5">
              <dt>저자</dt>
              <dd className="font-semibold text-fg">{book.author}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt>출판사</dt>
              <dd className="font-semibold text-fg">{book.publisher}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt>ISBN</dt>
              <dd className="font-semibold text-fg">{formatIsbn(book.isbn)}</dd>
            </div>
          </dl>

          {error ? (
            <ListErrorState
              message={error.message}
              onRetry={
                error.retryable ? () => setRetry((n) => n + 1) : undefined
              }
            />
          ) : (
            <DataTable<BookItemSummary>
              caption={`${book.title} 소장본 목록`}
              columns={BOOK_ITEM_COLUMNS}
              rows={detail?.bookItems ?? []}
              loading={loading}
              emptyText="등록된 소장본이 없습니다."
              renderCell={(col, value, row) =>
                col.key === "status" ? (
                  <StatusBadge status={toBookItemBadgeStatus(row.status)} />
                ) : (
                  (value as React.ReactNode)
                )
              }
            />
          )}
        </>
      )}
    </Card>
  );
}
