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
  /** LocalDateTime (ISO-ish). 미반납이면 null */
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
  status?: LoanStatus;
  /** 1-based */
  page?: number;
  /** 기본 10 */
  pageSize?: number;
};

/** 백엔드 LoanError 코드 (`books.ts`의 DUPLICATE_ISBN_CODE 네이밍 관례를 따른다) */
export const BOOK_ITEM_NOT_FOUND_CODE = "BOOK_ITEM_NOT_FOUND";
export const BOOK_ITEM_NOT_AVAILABLE_CODE = "BOOK_ITEM_NOT_AVAILABLE";

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
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  });
}
