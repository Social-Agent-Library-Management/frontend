import type { DataTableColumn } from "@/components/ui/data-table";
import type { BookStatus } from "@/components/library/status-badge";
import type { BookItemSummary, BookListItem } from "@/lib/api/books";
import type { BookItemStatus } from "@/lib/api/bookitems";

/**
 * 도서·소장본 표의 공용 정의. 컴포넌트가 아니므로 `"use client"`가 없다(순수 상수·순수 함수).
 *
 * `library/loan-table.ts`와 같은 역할이다 — 행 타입이 `BookListItem`/`BookItemSummary`인
 * 표의 컬럼 정의는 **전부 이 파일이 소유한다. 화면 파일에서 다시 정의하지 말 것.**
 * 두 벌이 되면 컬럼 폭과 라벨이 조용히 갈라진다.
 */

/**
 * 도서 목록/검색 결과 5컬럼. `BookListCard`(`#7`)와 `BookSearchResultCard`(`#23`)가 공유한다.
 *
 * 두 화면은 행 타입도 컬럼 **집합**도 같으므로 배열을 하나만 둔다.
 * (`loan-table.ts`가 배열을 둘 둔 이유는 집합이 달라서지 화면이 달라서가 아니다 —
 * 폭만 다른 클론을 만드는 것은 그 문서가 경계하는 드리프트 그 자체다.)
 *
 * 폭 합계 88%는 디자인 원본 그대로다 — `table-auto`가 잔여 폭을 분배한다.
 * 소장본 수 셀은 순수 숫자다. "권" 같은 단위를 셀에 붙이지 말 것 — 단위는 헤더 라벨이 갖는다.
 */
export const BOOK_COLUMNS: DataTableColumn<BookListItem>[] = [
  { key: "title", label: "도서명", width: "28%" },
  { key: "author", label: "저자", width: "14%" },
  { key: "publisher", label: "출판사", width: "16%", secondary: true },
  { key: "isbn", label: "ISBN", width: "20%", secondary: true, nowrap: true },
  { key: "bookItemCount", label: "소장본 수", width: "10%" },
];

/**
 * 소장본 목록 2컬럼(`BookCopiesCard`, `#23`). 폭 합계 100%.
 *
 * 좌측 5컬럼 표와 달리 잔여 폭을 남기지 않는다 — 폭 400px 패널의 2컬럼이라
 * 남겨 두면 컬럼이 흔들린다.
 *
 * ⚠️ 대출자·반납예정일 컬럼은 없다. 백엔드 `GET /books/{id}`의 `BookItemSummary`에
 *    해당 필드 **자체가 없다**(소장본 조회가 대출 도메인과 조인하지 않는다).
 *    디자인 원본의 4컬럼을 되살리지 말 것.
 */
export const BOOK_ITEM_COLUMNS: DataTableColumn<BookItemSummary>[] = [
  { key: "managementNumber", label: "관리번호", width: "60%", nowrap: true },
  { key: "status", label: "상태", width: "40%", nowrap: true },
];

/** 표에서 값이 없을 때의 표기 */
export const EMPTY_CELL = "—";

/** ISBN은 nullable이다. 빈 셀 대신 `—`로 "없음"을 명시한다(두 도서 표가 공유). */
export function formatIsbn(isbn: string | null): string {
  return isbn === null || isbn === "" ? EMPTY_CELL : isbn;
}

/**
 * 소장본 상태 → 상태 배지 어휘.
 *
 * `loan-table.ts`의 `toLoanBadgeStatus`와 같은 자리·같은 이유다 — 이건 화면 로직이 아니라
 * **서버 enum ↔ 배지 어휘의 사전**이고, `BookItemStatus`에 값이 추가되면
 * `Record<BookItemStatus, BookStatus>`가 컴파일 타임에 누락을 잡아준다.
 * 화면에 인라인하면 두 번째 소장본 표가 생기는 순간 매핑이 갈라진다.
 */
const BOOK_ITEM_BADGE_STATUS: Record<BookItemStatus, BookStatus> = {
  AVAILABLE: "available",
  ON_LOAN: "loaned",
  LOST: "lost",
  DISPOSED: "disposed",
};

export function toBookItemBadgeStatus(status: BookItemStatus): BookStatus {
  return BOOK_ITEM_BADGE_STATUS[status];
}
