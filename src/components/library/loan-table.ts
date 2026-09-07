import type { DataTableColumn } from "@/components/ui/data-table";
import type { BookStatus } from "@/components/library/status-badge";
import type { LoanSummary } from "@/lib/api/loans";

/**
 * 대출 목록 표의 공용 정의. 컴포넌트가 아니므로 `"use client"`가 없다(순수 상수·순수 함수).
 *
 * 행 타입이 `LoanSummary`인 대출 표의 컬럼 정의는 **전부 이 파일이 소유한다** —
 * **화면 파일에서 다시 정의하지 말 것.** 두 벌이 되면 컬럼 폭과 라벨이 조용히 갈라진다.
 *
 * 컬럼셋은 셋이다. 화면마다 컬럼 "집합"이 다르기 때문이지, 화면마다 표를 다시 그려서가 아니다.
 * - `LOAN_COLUMNS`           — 대출 현황(`LoanListCard`, `#11`). `status=ON_LOAN` 고정이라
 *                              `returnedAt`이 구조적으로 항상 null이다 → 반납일 컬럼 없음.
 * - `LOAN_HISTORY_COLUMNS`   — 대출 내역(`LoanHistoryCard`, `#15`/`#21`). 반납 완료 건이 섞이므로
 *                              반납일 컬럼이 있다.
 * - `DASHBOARD_LOAN_COLUMNS` — 대시보드 최근 활동(`RecentLoansCard`, `#37`). 좁은 2단 패널에
 *                              들어가야 해서 관리번호·반납예정일·반납일을 뺀 5컬럼이다.
 *
 * 셋째 컬럼셋이 생기면서 `#37`에서 **공통 정의 + 폭 주입**으로 리팩터했다(이전 버전 주석이
 * 예고한 조건이 충족됐다). 이제 `label`/`secondary`/`nowrap`은 `LOAN_COLUMN_DEFS` 한 곳에만
 * 있으므로, "같은 키인데 표마다 라벨이 다르다"는 실패 모드가 **구조적으로 불가능하다**.
 * 배열마다 달라지는 것은 **폭과 멤버십뿐**이다.
 *
 * 단, `ReturnListCard`의 `RETURN_COLUMNS`는 여기 두지 않는다(억지 일반화 금지) —
 * 화면 전용 액션 컬럼이 있고 `loanDate`가 없어 컬럼 집합 자체가 다르다.
 */

/**
 * 키 → 표시 속성의 단일 진실 원천. **라벨을 바꾸려면 여기만 고친다.**
 *
 * `secondary`(보조 색)와 `nowrap`은 필드의 성격에서 나오지 화면 취향에서 나오지 않는다:
 * 부서·대여일·반납예정일은 어느 표에서든 보조 정보이고, 날짜·코드는 어느 표에서든 줄바꿈하지 않는다.
 * 반납일이 `secondary`가 아닌 것은 의도적이다 — 값이 있을 때 본문과 같은 진한 색으로 강조한다.
 */
const LOAN_COLUMN_DEFS = {
  managementNumber: { label: "관리번호", nowrap: true },
  bookTitle: { label: "도서명" },
  borrowerName: { label: "대출자" },
  department: { label: "부서", secondary: true },
  loanDate: { label: "대여일", secondary: true, nowrap: true },
  dueDate: { label: "반납예정일", secondary: true, nowrap: true },
  returnedAt: { label: "반납일", nowrap: true },
  status: { label: "상태", nowrap: true },
} satisfies Record<string, Omit<DataTableColumn<LoanSummary>, "key" | "width">>;

type LoanColumnKey = keyof typeof LOAN_COLUMN_DEFS;

/**
 * 폭 객체로 컬럼 배열을 만든다.
 *
 * 인자가 **멤버십(어떤 키를 쓸지)과 순서(객체 리터럴의 키 삽입 순서)를 함께 정한다** —
 * 두 배열을 나란히 놓으면 차이가 폭 숫자로만 드러나 리뷰가 쉬워진다.
 * 폭 합계는 각 호출부에서 100%가 되게 맞춘다.
 */
function loanColumns(
  widths: Partial<Record<LoanColumnKey, string>>,
): DataTableColumn<LoanSummary>[] {
  return (Object.keys(widths) as LoanColumnKey[]).map((key) => ({
    key,
    width: widths[key],
    ...LOAN_COLUMN_DEFS[key],
  }));
}

/** 대출 현황(`LoanListCard`)용 7컬럼. 폭 합계 100%. */
export const LOAN_COLUMNS: DataTableColumn<LoanSummary>[] = loanColumns({
  managementNumber: "14%",
  bookTitle: "26%",
  borrowerName: "12%",
  department: "14%",
  loanDate: "12%",
  dueDate: "12%",
  status: "10%",
});

/**
 * 대출 내역(`LoanHistoryCard`)용 8컬럼. 폭 합계 100%.
 *
 * 반납일은 디자인대로 **반납예정일과 상태 사이**에 온다.
 * 빈 값(미반납) 표기는 `LoanHistoryCard`의 `renderCell`이 담당한다.
 *
 * 폭은 `LOAN_COLUMNS` 비율을 기준선으로 반납일 11%를 배정한 뒤 정수 재배분한 값이다
 * (디자인 원본 폭 합 94%는 목업 오차 — `_workspace_20260901_130606/01_design-spec.md` §1).
 */
export const LOAN_HISTORY_COLUMNS: DataTableColumn<LoanSummary>[] = loanColumns({
  managementNumber: "13%",
  bookTitle: "23%",
  borrowerName: "10%",
  department: "12%",
  loanDate: "11%",
  dueDate: "11%",
  returnedAt: "11%",
  status: "9%",
});

/**
 * 대시보드 최근 대출 활동(`RecentLoansCard`, `#37`)용 5컬럼. 폭 합계 100%.
 *
 * 관리번호·반납예정일·반납일이 없다 — 2단 패널의 좁은 폭(디자인 `flex:2 1 480px`)에
 * 7~8컬럼이 들어가면 도서명이 뭉개진다. 디자인 원본도 이 5개만 그린다.
 * 원본 폭(30/12/14/14/10 = 합 80%, 목업 오차)의 비율을 유지해 100%로 정규화했다.
 */
export const DASHBOARD_LOAN_COLUMNS: DataTableColumn<LoanSummary>[] =
  loanColumns({
    bookTitle: "37%",
    borrowerName: "15%",
    department: "18%",
    loanDate: "18%",
    status: "12%",
  });

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
