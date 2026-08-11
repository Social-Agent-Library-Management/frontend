import { apiFetch } from "@/lib/api/client";

/**
 * 소장본(BookItem) API.
 *
 * "소장본"은 `books.ts`의 `Book`(서지정보)이 아니라 물리적 사본 도메인이다.
 * 등록은 반드시 특정 `bookId` 아래로 들어간다 — 자유 텍스트 도서명으로는 만들 수 없다.
 */

/** 백엔드 BookItemStatus (SCREAMING_SNAKE — 서버 표기를 그대로 보존한다) */
export type BookItemStatus = "AVAILABLE" | "ON_LOAN" | "LOST" | "DISPOSED";

export type BookItem = {
  bookItemId: number;
  bookId: number;
  managementNumber: string;
  status: BookItemStatus;
  /** LocalDateTime (ISO-ish) */
  createdAt: string;
};

export type CreateBookItemInput = {
  /** 정규식 `^[^-\s]+-\d+$` (예: "문학-0001"). 검증 주체는 서버다 — 프론트에 정규식을 복제하지 않는다. */
  managementNumber: string;
};

/** 백엔드 BookItemError 코드 (books.ts의 DUPLICATE_ISBN_CODE 네이밍 관례를 따른다) */
export const BOOK_NOT_FOUND_CODE = "BOOK_NOT_FOUND";
export const INVALID_MANAGEMENT_NUMBER_FORMAT_CODE =
  "INVALID_MANAGEMENT_NUMBER_FORMAT";
export const DUPLICATE_MANAGEMENT_NUMBER_CODE = "DUPLICATE_MANAGEMENT_NUMBER";

/** POST /books/{bookId}/bookitems — 201 BookItemResponse */
export function createBookItem(
  bookId: number,
  input: CreateBookItemInput,
  signal?: AbortSignal,
): Promise<BookItem> {
  return apiFetch<BookItem>(`/books/${bookId}/bookitems`, {
    method: "POST",
    body: input,
    signal,
  });
}
