import { apiFetch, type PaginationMeta } from "@/lib/api/client";
import type { BookItemStatus } from "@/lib/api/bookitems";

/**
 * ⚠️ 아래 행 타입은 반드시 `interface`가 아니라 `type` 별칭으로 선언한다.
 * `DataTable<T extends Record<string, unknown>>` 제약은 암묵적 인덱스 시그니처를
 * 요구하는데, interface에는 그것이 없어 타입 에러가 난다.
 */
export type BookListItem = {
  id: number;
  title: string;
  author: string;
  /** 백엔드 Book 도메인상 non-blank(널 없음) */
  publisher: string;
  isbn: string | null;
  /** 활성(soft-delete 제외) 소장본 수 */
  bookItemCount: number;
};

export type Book = BookListItem & {
  /** LocalDateTime (ISO-ish) */
  createdAt: string;
};

/** 페이지네이션 봉투는 도메인 공통이라 `client.ts`가 소유한다. 기존 임포트 경로 유지를 위해 재수출만 한다. */
export type { PaginationMeta };

export type BookSearchResult = {
  books: BookListItem[];
  pagination: PaginationMeta;
};

/**
 * `GET /books/{id}` 응답의 소장본 항목.
 *
 * `bookitems.ts`의 `BookItem`과 필드가 겹치지만 **별개 타입으로 둔다** —
 * 서버가 별개 DTO(`GetBookService.BookItemSummary` vs `BookItemResponse`)이고
 * 이쪽에는 `bookId`가 없다. `Omit<BookItem, "bookId">` 같은 파생으로 묶지 않는다
 * (서버가 별개면 프론트도 별개로 둔다 — `LoanSearchStatus`/`LoanStatus` 선례).
 *
 * ⚠️ 위 `BookListItem`과 같은 이유로 반드시 `type` 별칭이다(`DataTable<T>` 제약).
 */
export type BookItemSummary = {
  bookItemId: number;
  /** 예: "문학-0001" */
  managementNumber: string;
  status: BookItemStatus;
  /** LocalDateTime (ISO-ish) */
  createdAt: string;
};

/**
 * `GET /books/{id}` 응답.
 *
 * ⚠️ `Book`(= `BookListItem & { createdAt }`)을 재사용하지 말 것.
 *    이 응답에는 **`bookItemCount`가 없다** — `Book`으로 타이핑하면 존재하지 않는
 *    필드가 타입상 존재하게 되어 `undefined`가 조용히 흐른다.
 */
export type BookDetail = {
  id: number;
  title: string;
  author: string;
  publisher: string;
  isbn: string | null;
  /** LocalDateTime (ISO-ish) */
  createdAt: string;
  bookItems: BookItemSummary[];
};

export type CreateBookInput = {
  title: string;
  author: string;
  /** POST /books 계약상 필수(non-blank) */
  publisher: string;
  isbn?: string | null;
};

export type SearchBooksParams = {
  q?: string;
  /** 1-based */
  page?: number;
  /** 기본 10, 최대 100 */
  pageSize?: number;
};

/** 백엔드 BookError 코드 */
export const DUPLICATE_ISBN_CODE = "DUPLICATE_ISBN";

/** POST /books — 201 BookResponse */
export function createBook(
  input: CreateBookInput,
  signal?: AbortSignal,
): Promise<Book> {
  return apiFetch<Book>("/books", { method: "POST", body: input, signal });
}

/**
 * GET /books/{id} — 200 BookDetail.
 *
 * 404(`BookError.NOT_FOUND`, soft-delete 포함)는 `ApiError`(status 404)로 정규화된다.
 * 상수 `BOOK_NOT_FOUND_CODE`를 여기 새로 만들지 말 것 — `bookitems.ts`에 이미 있고,
 * 호출부는 `code`가 아니라 `status`로 재시도 가능 여부를 가른다.
 */
export function getBook(id: number, signal?: AbortSignal): Promise<BookDetail> {
  return apiFetch<BookDetail>(`/books/${id}`, { signal });
}

/** GET /books/search */
export function searchBooks(
  params: SearchBooksParams = {},
  signal?: AbortSignal,
): Promise<BookSearchResult> {
  return apiFetch<BookSearchResult>("/books/search", {
    query: { q: params.q, page: params.page, pageSize: params.pageSize },
    signal,
  });
}
