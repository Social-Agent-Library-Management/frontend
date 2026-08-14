import { apiFetch, type PaginationMeta } from "@/lib/api/client";

/**
 * 대출(Loan) API.
 *
 * 대출은 도서(`books.ts`)가 아니라 **소장본의 관리번호**를 기준으로 생성된다.
 * 백엔드에 관리번호 검색/목록 엔드포인트가 없으므로(`findByManagementNumber`만 존재)
 * 프론트는 자유 입력을 그대로 보내고 존재/가용 여부는 서버 에러 코드로 판정한다.
 */

/** 백엔드 LoanStatus (SCREAMING_SNAKE — 서버 표기를 그대로 보존한다) */
export type LoanStatus = "ON_LOAN" | "RETURNED";

/**
 * `GET /loans`의 `status` 검색 파라미터 (백엔드 `SearchLoansService.LoanSearchStatus`).
 *
 * 행의 `LoanSummary.status`(`LoanStatus`, 2값)와 **다른 개념이다** — 서버에서도 별개 enum이다.
 * "연체"는 저장된 상태가 아니라 `ON_LOAN && dueDate < 오늘`의 파생이고, 서버가 조회 시점에
 * 계산한다. **클라이언트에서 다시 걸러내지 않는다** — 서버 페이지네이션과 건수가 어긋난다.
 *
 * `OVERDUE`는 `ON_LOAN`의 부분집합이다(상호배타가 아니다 — 서버 `LoanRepository.search`가
 * `overdueOnly` 플래그로 좁힐 뿐 `ON_LOAN` 자체를 기한으로 걸러내지 않는다):
 * - `ON_LOAN`  = 대출 중 전체 (연체 포함)
 * - `OVERDUE`  = 대출 중 && `dueDate < 오늘`  (`ON_LOAN`의 부분집합)
 * - `RETURNED` = 반납 완료 (기한 무관)
 *
 * `LoanStatus`에서 파생시키지 않는다(`LoanStatus | "OVERDUE"` ✗) — 서버에 없는 종속관계를
 * 주장하게 되고, 도메인 상태가 늘어나면 검색 파라미터로 새어 든다.
 */
export type LoanSearchStatus = "ON_LOAN" | "OVERDUE" | "RETURNED";

/**
 * ⚠️ 이 행 타입은 반드시 `interface`가 아니라 `type` 별칭으로 선언한다.
 * `DataTable<T extends Record<string, unknown>>` 제약은 암묵적 인덱스 시그니처를
 * 요구하는데, interface에는 그것이 없어 타입 에러가 난다(`books.ts`와 동일한 이유).
 */
export type LoanSummary = {
  loanId: number;
  managementNumber: string;
  bookTitle: string;
  borrowerName: string;
  department: string;
  /** LocalDate "YYYY-MM-DD" */
  loanDate: string;
  /** LocalDate "YYYY-MM-DD" — 서버가 `loanDate + LOAN_PERIOD_DAYS`로 확정한 값 */
  dueDate: string;
  /** LocalDate "YYYY-MM-DD" — 실제 반납일. 미반납이면 null (서버도 `LocalDate?`다) */
  returnedAt: string | null;
  status: LoanStatus;
  /** 서버가 계산한 연체 여부. **프론트에서 날짜로 재계산하지 않는다** */
  overdue: boolean;
};

export type LoanSearchResult = {
  loans: LoanSummary[];
  pagination: PaginationMeta;
};

export type CreateLoanInput = {
  managementNumber: string;
  borrowerName: string;
  department: string;
  /** "YYYY-MM-DD" */
  loanDate: string;
  // borrowerEmail은 서버에서 옵셔널이고 디자인에 입력 필드가 없어 보내지 않는다.
};

export type CreateLoanResult = {
  loanId: number;
  bookItemId: number;
  managementNumber: string;
  bookTitle: string;
  borrowerName: string;
  department: string;
  borrowerEmail: string | null;
  loanDate: string;
  dueDate: string;
  status: LoanStatus;
};

export type SearchLoansParams = {
  /** 생략 = 전체 조회. `ON_LOAN`은 연체 건도 포함한 대출 중 전체다(`LoanSearchStatus` 주석 참조) */
  status?: LoanSearchStatus;
  /**
   * 아래 세 필터는 서버 `LoanRepository.search`의 **부분 일치**이며 서로 AND로 묶인다.
   * 빈 문자열은 `buildUrl`이 자동으로 누락시키므로 호출부에서 `|| undefined`를 덧대지 않는다.
   * 다만 공백만 있는 값은 그대로 전송되므로 호출부가 `.trim()`한 값을 넘긴다.
   */
  bookTitle?: string;
  borrowerName?: string;
  department?: string;
  /** 1-based */
  page?: number;
  /** 기본 10 */
  pageSize?: number;
};

export type ReturnLoanResult = {
  loanId: number;
  managementNumber: string;
  loanDate: string;
  dueDate: string;
  /** LocalDate "YYYY-MM-DD". 반납 실패 시 null */
  returnedAt: string | null;
  status: LoanStatus;
  /** 연체 없이 반납했으면 null */
  overdueDays: number | null;
};

/**
 * `GET /loans/overdue` 행 타입.
 *
 * `LoanSummary`와 필드 집합이 다르다 — 연체 건만 내려오므로 `status`/`returnedAt`/`overdue`가
 * 없고 대신 `overdueDays`가 있다. 재사용하지 않고 별도 타입으로 둔다.
 *
 * ⚠️ `interface`가 아니라 `type` 별칭이다(`LoanSummary`와 동일한 이유 —
 * `DataTable<T extends Record<string, unknown>>`의 암묵적 인덱스 시그니처 요구).
 */
export type OverdueLoanSummary = {
  loanId: number;
  managementNumber: string;
  bookTitle: string;
  borrowerName: string;
  department: string;
  /** LocalDate "YYYY-MM-DD" */
  loanDate: string;
  /** LocalDate "YYYY-MM-DD" */
  dueDate: string;
  /** 서버가 조회 시점 기준으로 계산한 연체 경과일. **프론트에서 날짜로 재계산하지 않는다** */
  overdueDays: number;
};

export type OverdueLoanSearchResult = {
  loans: OverdueLoanSummary[];
  pagination: PaginationMeta;
};

export type SearchOverdueLoansParams = {
  /**
   * 부서명 **부분 일치**. 빈 문자열은 `buildUrl`이 자동으로 누락시키므로 호출부에서
   * `|| undefined`를 덧대지 않는다. 공백만 있는 값은 그대로 전송되므로 호출부가 `.trim()`한다.
   * `/loans`와 달리 도서명·대출자·관리번호 필터는 서버가 지원하지 않는다.
   */
  department?: string;
  /** 1-based */
  page?: number;
  /** 기본 10, 최대 100 */
  pageSize?: number;
};

/** 백엔드 LoanError 코드 (`books.ts`의 DUPLICATE_ISBN_CODE 네이밍 관례를 따른다) */
export const BOOK_ITEM_NOT_FOUND_CODE = "BOOK_ITEM_NOT_FOUND";
export const BOOK_ITEM_NOT_AVAILABLE_CODE = "BOOK_ITEM_NOT_AVAILABLE";
export const LOAN_NOT_FOUND_CODE = "LOAN_NOT_FOUND";
export const LOAN_NOT_ON_LOAN_CODE = "LOAN_NOT_ON_LOAN";

/** POST /loans — 201 LoanResponse */
export function createLoan(
  input: CreateLoanInput,
  signal?: AbortSignal,
): Promise<CreateLoanResult> {
  return apiFetch<CreateLoanResult>("/loans", {
    method: "POST",
    body: input,
    signal,
  });
}

/** GET /loans */
export function searchLoans(
  params: SearchLoansParams = {},
  signal?: AbortSignal,
): Promise<LoanSearchResult> {
  return apiFetch<LoanSearchResult>("/loans", {
    query: {
      status: params.status,
      bookTitle: params.bookTitle,
      borrowerName: params.borrowerName,
      department: params.department,
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  });
}

/**
 * GET /loans/overdue — `status=ON_LOAN` && `dueDate < 오늘`인 건만.
 *
 * 정렬은 서버가 `dueDate` ASC, `id` ASC로 고정한다(요청 파라미터로 변경 불가) —
 * 프론트에 정렬 UI를 만들지 않는다.
 */
export function searchOverdueLoans(
  params: SearchOverdueLoansParams = {},
  signal?: AbortSignal,
): Promise<OverdueLoanSearchResult> {
  return apiFetch<OverdueLoanSearchResult>("/loans/overdue", {
    query: {
      department: params.department,
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  });
}

/**
 * POST /loans/{loanId}/return — 반납 처리.
 *
 * 실제 반납일은 항상 서버가 오늘 날짜로 기록한다(디자인에 반납일 입력 필드가 없다) —
 * 바디 없이 호출한다.
 */
export function returnLoan(
  loanId: number,
  signal?: AbortSignal,
): Promise<ReturnLoanResult> {
  return apiFetch<ReturnLoanResult>(`/loans/${loanId}/return`, {
    method: "POST",
    signal,
  });
}
