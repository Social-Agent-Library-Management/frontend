import type { DataTableColumn } from "@/components/ui/data-table";
import type { BookStatus } from "@/components/library/status-badge";
import type { LoanSummary } from "@/lib/api/loans";

/**
 * 대출 목록 표의 공용 정의. 컴포넌트가 아니므로 `"use client"`가 없다(순수 상수·순수 함수).
 *
 * `LoanListCard`(`#11`)와 `LoanHistoryCard`(`#15`)가 같은 7컬럼·같은 상태 매핑을 쓰기에
 * 여기로 올렸다. **대출 표의 컬럼이나 상태 매핑을 화면에서 다시 정의하지 말 것** —
 * 두 벌이 되면 컬럼 폭과 배지 라벨이 화면마다 조용히 갈라진다.
 *
 * 단, `ReturnListCard`의 `RETURN_COLUMNS`는 여기 두지 않는다 — 액션 컬럼이 있고
 * `loanDate`가 없어 컬럼 집합 자체가 다르다(억지 일반화 금지).
 */

/** 렌더마다 재생성되지 않도록 모듈 스코프 상수다. 폭 합계 100%. */
export const LOAN_COLUMNS: DataTableColumn<LoanSummary>[] = [
  { key: "managementNumber", label: "관리번호", width: "14%", nowrap: true },
  { key: "bookTitle", label: "도서명", width: "26%" },
  { key: "borrowerName", label: "대출자", width: "12%" },
  { key: "department", label: "부서", width: "14%", secondary: true },
  { key: "loanDate", label: "대여일", width: "12%", secondary: true, nowrap: true },
  { key: "dueDate", label: "반납예정일", width: "12%", secondary: true, nowrap: true },
  { key: "status", label: "상태", width: "10%", nowrap: true },
];

/**
 * 대출 행 → 상태 배지.
 *
 * 연체 판정은 **서버가 내려준 `overdue`를 그대로 신뢰**한다 — 프론트에서 오늘 날짜와
 * `dueDate`를 다시 비교하면 클라이언트 시계·타임존에 따라 서버와 결론이 갈린다.
 * 목록이 `status=ON_LOAN`으로 필터링되더라도 라벨이 거짓말하지 않도록 반납 건까지 매핑한다.
 */
export function toLoanBadgeStatus(
  row: Pick<LoanSummary, "status" | "overdue">,
): BookStatus {
  if (row.status === "RETURNED") return "returned";
  return row.overdue ? "overdue" : "loaned";
}
