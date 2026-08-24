import type { ExportExcelRequest, ExportSheet } from "@/lib/api/excel";

/**
 * 내보내기 화면의 정적 설정과 순수 파생 로직.
 * 컴포넌트가 아니므로 `"use client"`가 없다(순수 상수·순수 함수).
 */

/**
 * 시트 목록과 컬럼 미리보기.
 *
 * ⚠️ 컬럼 문자열은 **백엔드가 실제로 쓰는 컬럼**이다(api-notes 기준). 디자인 목업의 컬럼
 * (도서의 "소장본 수", 소장본의 "도서명"/"최근 대출일" 등)을 되살리지 말 것.
 * 시트별 행 수도 표시하지 않는다 — 카운트 조회 API가 없다.
 */
export const EXPORT_SHEET_OPTIONS: readonly {
  id: ExportSheet;
  name: string;
  columns: readonly string[];
}[] = [
  {
    id: "BOOKS",
    name: "도서",
    columns: ["도서ID", "도서명", "저자", "출판사", "ISBN", "등록일시"],
  },
  {
    id: "BOOK_ITEMS",
    name: "소장본",
    columns: ["소장본ID", "도서ID", "관리번호", "상태", "등록일시"],
  },
  {
    id: "LOANS",
    name: "대여",
    columns: [
      "대여ID",
      "소장본ID",
      "관리번호",
      "도서명",
      "대출자",
      "부서",
      "이메일",
      "대출일",
      "반납예정일",
      "반납일",
      "상태",
    ],
  },
];

/** 기본은 세 시트 모두 선택(디자인 원본). */
export const DEFAULT_EXPORT_SHEETS: readonly ExportSheet[] = [
  "BOOKS",
  "BOOK_ITEMS",
  "LOANS",
];

export type ExportOptionsValue = {
  /** "" = 미지정(전체 기간) */
  loanDateFrom: string;
  loanDateTo: string;
  includeInactiveItems: boolean;
  unreturnedOnly: boolean;
};

/**
 * 토글 기본값은 **서버 기본값과 일치시킨다**(`includeInactiveItems` true / `unreturnedOnly` false).
 * 날짜는 둘 다 빈 값(전체 기간)이다 — 디자인의 하드코딩 날짜를 되살리지 말 것.
 */
export const DEFAULT_EXPORT_OPTIONS: ExportOptionsValue = {
  loanDateFrom: "",
  loanDateTo: "",
  includeInactiveItems: true,
  unreturnedOnly: false,
};

export const DATE_RANGE_ERROR_MESSAGE = "시작일이 종료일보다 늦습니다.";

/**
 * 서버 400(`INVALID_DATE_RANGE`)이 나기 전에 프론트에서 먼저 막는다.
 * 둘 다 채워졌을 때만 비교한다. `YYYY-MM-DD`는 사전순 비교 = 시간순 비교다.
 */
export function isInvalidDateRange(from: string, to: string): boolean {
  return from !== "" && to !== "" && from > to;
}

/**
 * 화면에 보여줄 **예상** 파일명.
 *
 * ⚠️ 이 값을 다운로드 파일명으로 쓰지 말 것 — 실제 파일명은 서버의 `Content-Disposition`이
 * 결정하며 `exportExcel()`이 반환한다. 여기 있는 건 순수 표시용 추정치다.
 * UTC가 아니라 **로컬 날짜**로 만든다(`toISOString()`은 KST 저녁에 하루 어긋난다).
 */
export function estimateExportFileName(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `library_export_${y}-${m}-${d}.xlsx`;
}

/** 폼 상태 → 요청 바디. 빈 날짜는 키 자체를 생략한다(서버 optional). */
export function toExportRequest(
  selected: ReadonlySet<ExportSheet>,
  options: ExportOptionsValue,
): ExportExcelRequest {
  return {
    // 순서를 EXPORT_SHEET_OPTIONS 기준으로 고정한다 — Set 순회 순서에 요청이 흔들리지 않게.
    sheets: EXPORT_SHEET_OPTIONS.filter((s) => selected.has(s.id)).map(
      (s) => s.id,
    ),
    ...(options.loanDateFrom !== ""
      ? { loanDateFrom: options.loanDateFrom }
      : {}),
    ...(options.loanDateTo !== "" ? { loanDateTo: options.loanDateTo } : {}),
    includeInactiveItems: options.includeInactiveItems,
    unreturnedOnly: options.unreturnedOnly,
  };
}
