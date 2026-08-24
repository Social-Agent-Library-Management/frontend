import {
  buildUrl,
  isAbortError,
  networkError,
  toApiError,
} from "@/lib/api/client";

/**
 * 엑셀 일괄 등록 / 내보내기 API (`POST /imports/excel`, `POST /exports/excel`).
 *
 * 이 도메인만 `apiFetch`를 쓰지 않는다 — 등록은 multipart 요청이고 내보내기는 Blob 응답이라
 * JSON 전용인 `apiFetch`의 계약에 맞지 않는다. 대신 에러 정규화는 `client.ts`의 공용 헬퍼
 * (`networkError` / `toApiError`)를 그대로 재사용해 다른 도메인과 동일한 `ApiError`를 던진다.
 * **여기서 `ApiError`를 손으로 조립하지 말 것.**
 */

/* ── 1) 엑셀 일괄 등록 ─────────────────────────────────── */

/**
 * 등록 결과의 행 단위 항목(경고·오류 공용).
 *
 * ⚠️ 반드시 `interface`가 아니라 `type` 별칭이다 — `DataTable<T extends Record<string, unknown>>`
 *    제약은 암묵적 인덱스 시그니처를 요구한다(`books.ts`/`bookitems.ts`와 동일 주의사항).
 *
 * `code`는 화면에 렌더하지 않고 분기 로직에도 쓰지 않는다 — 서버가 준 `message`를 그대로 보여준다
 * (api-notes 명시). 타입에는 남겨 두되 소비하지 말 것.
 */
export type ExcelImportRowResult = {
  sheet: string;
  rowNumber: number;
  managementNumber: string | null;
  title: string | null;
  code: string | null;
  message: string | null;
  errorField: string | null;
};

/** 201 Created — ImportOutcome.Committed */
export type ExcelImportCommitted = {
  /** LocalDateTime, "T" 포함 ISO 형태 */
  committedAt: string;
  sheets: string[];
  totalRows: number;
  createdBooks: number;
  createdBookItems: number;
  okRows: number;
  warnRows: number;
  warnings: ExcelImportRowResult[];
};

/** 409 Conflict — ImportOutcome.Rejected (all-or-nothing, 아무 것도 등록되지 않음) */
export type ExcelImportRejected = {
  errorRows: number;
  errors: ExcelImportRowResult[];
};

/**
 * 등록 결과 유니온.
 *
 * ⚠️ `status` 판별자는 **프론트가 만든 것**이다 — 서버 JSON 바디에는 discriminator 필드가 없고
 *    성공/거부는 HTTP 상태(2xx / 409)로만 구분된다. 바디에서 `status`를 찾지 말 것.
 */
export type ExcelImportOutcome =
  | { status: "committed"; data: ExcelImportCommitted }
  | { status: "rejected"; data: ExcelImportRejected };

/** 400/413 — 요청 자체 실패(ProblemDetail). `ApiError.code`로 온다. */
export const INVALID_FILE_TYPE_CODE = "INVALID_FILE_TYPE";
export const UNREADABLE_FILE_CODE = "UNREADABLE_FILE";
export const REQUIRED_COLUMN_NOT_FOUND_CODE = "REQUIRED_COLUMN_NOT_FOUND";
export const FILE_TOO_LARGE_CODE = "FILE_TOO_LARGE";

/**
 * POST /imports/excel — multipart 업로드.
 *
 * 2xx → committed, 409 → rejected (둘 다 **정상 반환**).
 * 그 외(400/413/5xx)만 `ApiError`로 throw. `AbortError`는 그대로 다시 던진다.
 */
export async function importExcel(
  file: File,
  signal?: AbortSignal,
): Promise<ExcelImportOutcome> {
  const formData = new FormData();
  formData.append("file", file); // 백엔드 @RequestPart 파라미터명

  let response: Response;
  try {
    response = await fetch(buildUrl("/imports/excel"), {
      method: "POST",
      // ⚠️ Content-Type을 직접 지정하지 말 것 — 브라우저가 multipart boundary를 붙인다.
      headers: { Accept: "application/json" },
      body: formData,
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (isAbortError(error) || signal?.aborted) throw error;
    throw networkError();
  }

  if (response.ok) {
    return {
      status: "committed",
      data: (await response.json()) as ExcelImportCommitted,
    };
  }
  if (response.status === 409) {
    // ⚠️ toApiError를 태우면 안 된다 — {errorRows, errors} 바디가 유실된다.
    return {
      status: "rejected",
      data: (await response.json()) as ExcelImportRejected,
    };
  }
  throw await toApiError(response);
}

/* ── 2) 내보내기 ───────────────────────────────────────── */

export type ExportSheet = "BOOKS" | "BOOK_ITEMS" | "LOANS";

export type ExportExcelRequest = {
  sheets: ExportSheet[];
  /** LocalDate("YYYY-MM-DD"). 빈 값이면 **키 자체를 생략**한다 */
  loanDateFrom?: string;
  loanDateTo?: string;
  /** 서버 기본 true */
  includeInactiveItems?: boolean;
  /** 서버 기본 false */
  unreturnedOnly?: boolean;
};

export type ExportExcelResult = {
  blob: Blob;
  /** `Content-Disposition`에서 읽은 서버 결정 파일명. 클라이언트에서 조합하지 않는다. */
  filename: string;
};

/** 400 — ProblemDetail */
export const NO_SHEET_SELECTED_CODE = "NO_SHEET_SELECTED";
export const INVALID_DATE_RANGE_CODE = "INVALID_DATE_RANGE";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * `Content-Disposition` 헤더에서 파일명을 뽑는다.
 * RFC 5987(`filename*=UTF-8''…`)을 우선 시도하고(한글 파일명), 없으면 `filename="…"`.
 */
function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null;

  const encoded = /filename\*\s*=\s*[^']*''([^;]+)/i.exec(header);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim());
    } catch {
      /* 잘못 인코딩된 헤더 — 아래 plain 경로로 폴백 */
    }
  }

  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
}

/**
 * 헤더를 못 읽었을 때의 폴백 파일명.
 *
 * ⚠️ `Content-Disposition`은 CORS-safelisted 응답 헤더가 **아니다**. 백엔드가
 * `Access-Control-Expose-Headers: Content-Disposition`을 내려주지 않으면 교차 출처
 * (localhost:3000 → localhost:8080)에서 `headers.get()`이 null을 반환해 이 값으로 떨어진다.
 * 다운로드가 항상 이 이름으로 저장되면 프론트 버그가 아니라 백엔드 CORS 설정 문제다.
 */
export const DEFAULT_EXPORT_FILENAME = "library_export.xlsx";

/** POST /exports/excel — JSON 요청, Blob 응답. 400은 `ApiError`로 throw. */
export async function exportExcel(
  request: ExportExcelRequest,
  signal?: AbortSignal,
): Promise<ExportExcelResult> {
  let response: Response;
  try {
    response = await fetch(buildUrl("/exports/excel"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: `${XLSX_MIME}, application/json`,
      },
      body: JSON.stringify(request),
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (isAbortError(error) || signal?.aborted) throw error;
    throw networkError();
  }

  if (!response.ok) throw await toApiError(response);

  const blob = await response.blob();
  const filename =
    parseContentDispositionFilename(
      response.headers.get("Content-Disposition"),
    ) ?? DEFAULT_EXPORT_FILENAME;

  return { blob, filename };
}
