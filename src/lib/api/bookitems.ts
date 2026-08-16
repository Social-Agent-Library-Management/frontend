import { apiFetch, type PaginationMeta } from "@/lib/api/client";

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
/**
 * `PATCH /bookitems/{id}/status` 404. 대출 도메인(`LoanError`)도 같은 코드를 던지므로
 * `loans.ts`가 이 상수를 재수출한다 — 두 벌로 늘리지 말 것.
 */
export const BOOK_ITEM_NOT_FOUND_CODE = "BOOK_ITEM_NOT_FOUND";
/** `BookItem.changeStatus`의 require 위반(400). 프론트가 LOST/DISPOSED만 보내므로 정상 흐름에선 나지 않는다. */
export const INVALID_STATUS_CODE = "INVALID_STATUS";

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

/**
 * `GET /bookitems` 응답의 행.
 *
 * `BookItem`(POST 응답)·`BookItemSummary`(`books.ts`, `GET /books/{id}` 응답)와 **별개 타입이다** —
 * 서버가 별개 DTO이고 이쪽에만 `bookTitle`(JOIN 결과)이 있다. `Omit`/교차 타입으로 파생시키지 말 것
 * (`LoanSearchStatus`/`LoanStatus` 선례).
 *
 * ⚠️ 반드시 `interface`가 아니라 `type` 별칭이다 — `DataTable<T extends Record<string, unknown>>`
 *    제약은 암묵적 인덱스 시그니처를 요구한다.
 */
export type BookItemSearchRow = {
  bookItemId: number;
  bookId: number;
  /** 서버가 JOIN해 내려준다 — 클라이언트에서 도서명을 다시 조회하지 않는다 */
  bookTitle: string;
  managementNumber: string;
  status: BookItemStatus;
  /** LocalDateTime (ISO-ish). 이 화면 컬럼엔 노출하지 않는다 */
  createdAt: string;
};

export type BookItemSearchResult = {
  bookItems: BookItemSearchRow[];
  /** 봉투 타입은 `client.ts`가 소유한다 — 복제 금지 */
  pagination: PaginationMeta;
};

export type SearchBookItemsParams = {
  /** 도서명·지은이 부분 일치 */
  q?: string;
  /** 관리번호 부분 일치. `q`와 함께 주면 서버에서 **AND**로 묶인다(OR 검색 불가) */
  managementNumber?: string;
  /** 1-based */
  page?: number;
  /** 기본 10, 최대 100 */
  pageSize?: number;
};

/**
 * `PATCH /bookitems/{id}/status`로 지정 가능한 상태.
 *
 * `LoanSearchStatus`와 달리 **서버에서도 같은 enum의 부분집합**이다
 * (`BookItem.changeStatus`가 `require`로 두 값만 허용). 별개 enum이 아니므로 `Extract`로 묶어
 * `BookItemStatus`에 값이 추가돼도 오타가 컴파일 타임에 잡히게 한다.
 */
export type ChangeableBookItemStatus = Extract<
  BookItemStatus,
  "LOST" | "DISPOSED"
>;

export type ChangeBookItemStatusInput = { status: ChangeableBookItemStatus };

export type ChangeBookItemStatusResult = {
  bookItemId: number;
  managementNumber: string;
  status: ChangeableBookItemStatus;
};

/** GET /bookitems — 검색·목록. 빈 문자열 파라미터는 `buildUrl`이 자동 누락시킨다. */
export function searchBookItems(
  params: SearchBookItemsParams = {},
  signal?: AbortSignal,
): Promise<BookItemSearchResult> {
  return apiFetch<BookItemSearchResult>("/bookitems", {
    query: {
      q: params.q,
      managementNumber: params.managementNumber,
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  });
}

/**
 * PATCH /bookitems/{bookItemId}/status — 분실·폐기 처리.
 *
 * 서버는 현재 상태(source)를 검사하지 않는다. ON_LOAN 차단은 **UI 정책**이며
 * `CopyListCard`가 버튼 자체를 렌더하지 않는 것으로 강제한다.
 */
export function changeBookItemStatus(
  bookItemId: number,
  input: ChangeBookItemStatusInput,
  signal?: AbortSignal,
): Promise<ChangeBookItemStatusResult> {
  return apiFetch<ChangeBookItemStatusResult>(
    `/bookitems/${bookItemId}/status`,
    {
      method: "PATCH",
      body: input,
      signal,
    },
  );
}
