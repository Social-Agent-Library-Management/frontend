import { apiFetch } from "@/lib/api/client";
import type { LoanSummary, OverdueLoanSummary } from "@/lib/api/loans";

/**
 * 대시보드(Dashboard) API.
 *
 * 백엔드에 **화면 전용 집계 엔드포인트**가 있다(`DashboardController`) — 도서 수·소장본 수·
 * 대출 건수·연체 건수와 두 목록을 한 번에 내려준다. 대시보드를 그리려고
 * `/books`·`/bookitems`·`/loans`를 각각 긁지 말 것: 호출이 4~5개로 늘고 집계 기준일도
 * 호출마다 갈라진다(서버는 `LocalDate.now()` 한 번으로 전부 계산한다).
 */

export type DashboardSummary = {
  /** 전체 도서(서지) 수 */
  bookCount: number;
  /** 전체 소장본 수 */
  bookItemCount: number;
  /** 대출 가능(AVAILABLE) 소장본 수 */
  availableBookItemCount: number;
  /** 현재 대출 중인 건수 — **연체 건도 포함한다** */
  activeLoanCount: number;
  /**
   * 연체 건수. `activeLoanCount`의 부분집합이다(`LoanSearchStatus` 주석과 같은 관계).
   * `overdueLoans.length`가 아니라 이 값이 전체 건수다 — 목록은 `overdueLimit`으로 잘려 있다.
   */
  overdueLoanCount: number;
  /** 최근 대출 활동 — 대여일 내림차순. **상태 필터가 없어 반납 완료 건이 섞인다** */
  recentLoans: LoanSummary[];
  /** 연체 목록 — 경과일 내림차순 */
  overdueLoans: OverdueLoanSummary[];
};

/**
 * 목록 표시 건수. **모듈 상수로 고정한다.**
 *
 * 서버가 `@Cacheable(key = "#recentLoanLimit + '-' + #overdueLimit")`이라 limit을
 * 화면에서 흔들면 캐시 키가 조합마다 갈라진다. 값의 근거는 `_workspace/01_design-spec.md` §4:
 * - 최근 대출 10건 — 기획 확정
 * - 연체 6건 — 좌측 10행 표(≈610px)와 우측 카드 높이를 맞추는 최대 개수
 */
export const RECENT_LOAN_LIMIT = 10;
export const OVERDUE_LIMIT = 6;

/** GET /dashboard/summary */
export function getDashboardSummary(
  signal?: AbortSignal,
): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/dashboard/summary", {
    query: {
      recentLoanLimit: RECENT_LOAN_LIMIT,
      overdueLimit: OVERDUE_LIMIT,
    },
    signal,
  });
}
