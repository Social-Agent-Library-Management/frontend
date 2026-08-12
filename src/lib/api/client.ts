/**
 * 백엔드 공통 fetch 계층.
 *
 * 모든 도메인 모듈(`books.ts`, 향후 `copies.ts`·`loans.ts`)이 이 파일을 재사용한다.
 * **컴포넌트에서 `fetch`를 직접 호출하지 말 것** — 에러 정규화가 깨진다.
 *
 * 이 파일에는 `"use client"`를 붙이지 않는다. 서버/클라이언트 양쪽에서
 * 임포트 가능한 순수 모듈이다.
 */

/**
 * Next.js는 `NEXT_PUBLIC_*`를 빌드 시 정적 치환한다.
 * 반드시 `process.env.NEXT_PUBLIC_API_BASE_URL` 전체 표현식을 그대로 쓸 것
 * (구조분해·동적 인덱싱은 치환되지 않는다).
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

/** 백엔드 SystemExceptionHandler의 RFC7807 확장 응답 */
export type ProblemDetail = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  traceId: string | null;
};

/**
 * 백엔드 목록 응답의 공통 `pagination` 봉투.
 * 도서·대출 등 도메인마다 같은 모양이라 도메인 파일에 복제하지 않고 여기서 한 번만 정의한다.
 */
export type PaginationMeta = {
  /** 1-based */
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
};

export const NETWORK_ERROR_CODE = "NETWORK_ERROR";
export const UNKNOWN_ERROR_CODE = "UNKNOWN_ERROR";

/** 사용자에게 그대로 보여줄 수 있는 메시지(`detail`)를 항상 갖는 에러 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string;
  readonly traceId: string | null;
  readonly problem: ProblemDetail | null;

  constructor(init: {
    status: number;
    code: string;
    detail: string;
    traceId?: string | null;
    problem?: ProblemDetail | null;
  }) {
    super(init.detail);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.detail = init.detail;
    this.traceId = init.traceId ?? null;
    this.problem = init.problem ?? null;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export type QueryValue = string | number | boolean | null | undefined;

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON 직렬화해 전송할 바디 */
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
};

/** 취소는 호출부가 언마운트/경합으로 구분해야 하므로 ApiError로 감싸지 않는다. */
function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") continue;
    params.set(key, String(value));
  }

  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/** `!response.ok`일 때의 바디를 ProblemDetail로 안전 파싱한다. */
function toProblemDetail(body: unknown): ProblemDetail | null {
  if (typeof body !== "object" || body === null) return null;

  const candidate = body as Record<string, unknown>;
  if (
    typeof candidate.code !== "string" ||
    typeof candidate.detail !== "string"
  ) {
    return null;
  }

  return {
    type: typeof candidate.type === "string" ? candidate.type : "about:blank",
    title: typeof candidate.title === "string" ? candidate.title : candidate.code,
    status: typeof candidate.status === "number" ? candidate.status : 0,
    detail: candidate.detail,
    instance: typeof candidate.instance === "string" ? candidate.instance : "",
    code: candidate.code,
    traceId: typeof candidate.traceId === "string" ? candidate.traceId : null,
  };
}

/**
 * JSON API 호출. 실패는 항상 `ApiError`로 정규화되며,
 * 사용자 노출 문구는 `error.detail`이다. `AbortError`만 그대로 다시 던진다.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, query, signal } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // 등록 직후 refetch가 캐시에 막히면 안 된다.
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (isAbortError(error) || signal?.aborted) throw error;
    throw new ApiError({
      status: 0,
      code: NETWORK_ERROR_CODE,
      detail: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    });
  }

  if (!response.ok) {
    let parsed: unknown = null;
    try {
      parsed = await response.json();
    } catch {
      parsed = null;
    }

    const problem = toProblemDetail(parsed);
    if (problem) {
      throw new ApiError({
        status: response.status,
        code: problem.code,
        detail: problem.detail,
        traceId: problem.traceId,
        problem,
      });
    }

    throw new ApiError({
      status: response.status,
      code: UNKNOWN_ERROR_CODE,
      detail: `요청을 처리하지 못했습니다. (HTTP ${response.status})`,
    });
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (text === "") return undefined as T;

  return JSON.parse(text) as T;
}
