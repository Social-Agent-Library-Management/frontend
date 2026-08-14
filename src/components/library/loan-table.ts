import type { DataTableColumn } from "@/components/ui/data-table";
import type { BookStatus } from "@/components/library/status-badge";
import type { LoanSummary } from "@/lib/api/loans";

/**
 * 대출 목록 표의 공용 정의. 컴포넌트가 아니므로 `"use client"`가 없다(순수 상수·순수 함수).
 *
 * 행 타입이 `LoanSummary`인 대출 표의 컬럼 정의는 **전부 이 파일이 소유한다** —
 * **화면 파일에서 다시 정의하지 말 것.** 두 벌이 되면 컬럼 폭과 라벨이 조용히 갈라진다.
 *
 * 컬럼셋은 둘이다. 화면마다 컬럼 "집합"이 다르기 때문이지, 화면마다 표를 다시 그려서가 아니다.
 * - `LOAN_COLUMNS`         — 대출 현황(`LoanListCard`, `#11`). `status=ON_LOAN` 고정이라
 *                            `returnedAt`이 구조적으로 항상 null이다 → 반납일 컬럼 없음.
 * - `LOAN_HISTORY_COLUMNS` — 대출 내역(`LoanHistoryCard`, `#15`/`#21`). 반납 완료 건이 섞이므로
 *                            반납일 컬럼이 있다(디자인도 두 화면을 다르게 그린다).
 *
 * ⚠️ 두 배열의 `label` / `secondary` / `nowrap`은 **같은 키에 대해 반드시 같아야 한다**.
 *    다른 것은 폭과 반납일 컬럼 유무뿐이다. 한쪽만 고치지 말 것.
 *    셋째 컬럼셋이 필요해지면 그때 공통 정의 + 폭 주입으로 리팩터한다(지금은 과잉 추상화).
 *
 * 단, `ReturnListCard`의 `RETURN_COLUMNS`는 여기 두지 않는다(억지 일반화 금지) —
 * 화면 전용 액션 컬럼이 있고 `loanDate`가 없어 컬럼 집합 자체가 다르다.
 */

/** 대출 현황(`LoanListCard`)용 7컬럼. 모듈 스코프 상수(렌더마다 재생성 금지). 폭 합계 100%. */
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
 * 대출 내역(`LoanHistoryCard`)용 8컬럼. 폭 합계 100%.
 *
 * 반납일은 디자인대로 **반납예정일과 상태 사이**에 온다. 부서·대여일·반납예정일과 달리
 * `secondary`가 아니다 — 값이 있을 때 본문과 같은 진한 색(`text-fg`)으로 강조한다.
 * 빈 값(미반납) 표기는 `LoanHistoryCard`의 `renderCell`이 담당한다.
 *
 * 폭은 `LOAN_COLUMNS` 비율을 기준선으로 반납일 11%를 배정한 뒤 정수 재배분한 값이다
 * (디자인 원본 폭 합 94%는 목업 오차 — `_workspace/01_design-spec.md` §1).
 */
export const LOAN_HISTORY_COLUMNS: DataTableColumn<LoanSummary>[] = [
  { key: "managementNumber", label: "관리번호", width: "13%", nowrap: true },
  { key: "bookTitle", label: "도서명", width: "23%" },
  { key: "borrowerName", label: "대출자", width: "10%" },
  { key: "department", label: "부서", width: "12%", secondary: true },
  { key: "loanDate", label: "대여일", width: "11%", secondary: true, nowrap: true },
  { key: "dueDate", label: "반납예정일", width: "11%", secondary: true, nowrap: true },
  { key: "returnedAt", label: "반납일", width: "11%", nowrap: true },
  { key: "status", label: "상태", width: "9%", nowrap: true },
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
