import type { DataTableColumn } from "@/components/ui/data-table";
import type { BookStatus } from "@/components/library/status-badge";
import type { LoanActivity, LoanSummary } from "@/lib/api/loans";

/**
 * 대출 목록 표의 공용 정의. 컴포넌트가 아니므로 `"use client"`가 없다(순수 상수·순수 함수).
 *
 * 대출 표의 컬럼 정의는 행 타입(`LoanSummary` / `LoanActivity`)과 무관하게
 * **전부 이 파일이 소유한다** — **화면 파일에서 다시 정의하지 말 것.**
 * 두 벌이 되면 컬럼 폭과 라벨이 조용히 갈라진다.
 *
 * 컬럼셋은 셋이다. 화면마다 컬럼 "집합"이 다르기 때문이지, 화면마다 표를 다시 그려서가 아니다.
 * - `LOAN_COLUMNS`           — 대출 현황(`LoanListCard`, `#11`). `status=ON_LOAN` 고정이라
 *                              `returnedAt`이 구조적으로 항상 null이다 → 반납일 컬럼 없음.
 * - `LOAN_HISTORY_COLUMNS`   — 대출 내역(`LoanHistoryCard`, `#15`/`#21`). 반납 완료 건이 섞이므로
 *                              반납일 컬럼이 있다.
 * - `DASHBOARD_LOAN_COLUMNS` — 대시보드 최근 활동(`RecentLoansCard`, `#37`/`#45`). 행 타입만
 *                              `LoanActivity`다 — 이 표의 행은 대출 건이 아니라 대출/반납
 *                              **이벤트**라 대여일 대신 활동 시각(`activityAt`)을 그리고
 *                              `status` 헤더도 "활동"이다. 좁은 2단 패널이라 관리번호·
 *                              반납예정일·반납일은 여전히 없다.
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

/**
 * 대시보드 "최근 활동" 표(`LoanActivity` 행)에서만 갈라지는 컬럼. `#45`.
 *
 * `LOAN_COLUMN_DEFS`에 합치지 않는 이유는 둘이다.
 * - `activityAt`은 `LoanSummary`에 없는 키라 `loanColumns()`(반환 타입이
 *   `DataTableColumn<LoanSummary>[]`)가 컴파일되지 않는다.
 * - `status`의 라벨이 이 표에서만 "활동"이다 — 행이 대출 "건"이 아니라 대출/반납
 *   "이벤트"라서다. 디자인 확정 문구이며, 다른 표의 "상태"는 그대로 둔다.
 *   `loanColumns()`에 라벨 오버라이드 인자를 추가하지 말 것 — `#37`이 없앤
 *   "표마다 라벨이 갈라지는" 경로가 되살아난다. 갈라짐은 이 객체 안에만 가둔다.
 *
 * **`LoanActivity` 전용 컬럼셋이 둘째로 생기면** 그때 `loanColumns()`를 행 타입으로
 * 제네릭화해 두 defs를 합친다. 지금은 소비처가 하나라 그 비용이 과하다.
 *
 * `activityAt`의 라벨이 빈 문자열인 것은 의도다(디자인 원본 `label:''`) —
 * `DataTableColumn.label`은 필수 `string`이라 "생략"이 아니라 "빈 값"이고,
 * 헤더 칸은 그려지되 글자가 없다.
 */
const ACTIVITY_COLUMN_DEFS = {
  status: { label: "활동", nowrap: true },
  activityAt: { label: "", secondary: true, nowrap: true },
} satisfies Record<string, Omit<DataTableColumn<LoanActivity>, "key" | "width">>;

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
 * (디자인 원본 폭 합 94%는 목업 오차다).
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
 * 대시보드 최근 활동(`RecentLoansCard`, `#37` → `#45`)용 5컬럼. 폭 합계 100%.
 *
 * 행 타입이 이 파일에서 유일하게 `LoanActivity`다. `#45`에서 대여일 컬럼이 빠지고
 * 활동 시각 컬럼이 들어왔다 — 서버 정렬 기준이 대여일에서 활동 시각으로 바뀌었으므로
 * 표가 대여일로 정렬된 것처럼 보이면 거짓말이 된다.
 *
 * 관리번호·반납예정일·반납일이 없는 이유는 기존과 같다 — 2단 패널의 좁은 폭
 * (디자인 `flex:2 1 480px`)에 7~8컬럼이 들어가면 도서명이 뭉개진다.
 * 디자인 원본 폭(30/12/16/14/14 = 합 86%, 목업 오차)의 비율을 유지해 100%로 정규화했다.
 */
export const DASHBOARD_LOAN_COLUMNS: DataTableColumn<LoanActivity>[] = [
  ...loanColumns({
    bookTitle: "35%",
    borrowerName: "14%",
    department: "19%",
  }),
  { key: "status", width: "16%", ...ACTIVITY_COLUMN_DEFS.status },
  { key: "activityAt", width: "16%", ...ACTIVITY_COLUMN_DEFS.activityAt },
];

/**
 * 대출 행 → 상태 배지.
 *
 * 연체 판정은 **서버가 내려준 `overdue`를 그대로 신뢰**한다 — 프론트에서 오늘 날짜와
 * `dueDate`를 다시 비교하면 클라이언트 시계·타임존에 따라 서버와 결론이 갈린다.
 * 목록이 `status=ON_LOAN`으로 필터링되더라도 라벨이 거짓말하지 않도록 반납 건까지 매핑한다.
 *
 * `LoanActivity`(대시보드 최근 활동)도 `status`/`overdue`를 같은 타입으로 가져
 * 이 시그니처를 구조적으로 그대로 통과한다 — 행 타입마다 오버로드를 만들지 말 것.
 */
export function toLoanBadgeStatus(
  row: Pick<LoanSummary, "status" | "overdue">,
): BookStatus {
  if (row.status === "RETURNED") return "returned";
  return row.overdue ? "overdue" : "loaned";
}
