import { apiFetch } from "@/lib/api/client";

/**
 * ⚠️ 아래 행 타입은 반드시 `interface`가 아니라 `type` 별칭으로 선언한다.
 * `DataTable<T extends Record<string, unknown>>` 제약은 암묵적 인덱스 시그니처를
 * 요구하는데, interface에는 그것이 없어 타입 에러가 난다.
 */
export type BookListItem = {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
};

export type Book = BookListItem & {
  /** LocalDateTime (ISO-ish) */
  createdAt: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
};

export type BookSearchResult = {
  books: BookListItem[];
  pagination: PaginationMeta;
};

export type CreateBookInput = {
  title: string;
  author: string;
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
