import type { DataTableColumn } from "@/components/ui/data-table";
import type { ExcelImportRowResult } from "@/lib/api/excel";

/**
 * 엑셀 등록 결과 표의 컬럼 정의. `book-table.ts`/`loan-table.ts`와 같은 자리·같은 이유다 —
 * 행 타입이 `ExcelImportRowResult`인 표의 컬럼은 전부 이 파일이 소유한다.
 * **화면 파일에서 다시 정의하지 말 것.**
 *
 * 배열이 둘인 이유는 화면이 둘이어서가 아니라 **집합이 다르기 때문**이다 —
 * 경고 표에는 `errorField`가 없다(경고 행은 특정 필드를 지목하지 않는다).
 * 두 배열에서 같은 키의 `label`/`secondary`/`nowrap`은 항상 일치해야 하고 다른 것은 폭뿐이다.
 * `code`는 두 표 모두 노출하지 않는다 — 사용자에게 보여줄 문구는 `message`다.
 */

/** 경고 목록 5컬럼. 폭 합계 100%(디자인 원본 값). */
export const IMPORT_WARNING_COLUMNS: DataTableColumn<ExcelImportRowResult>[] = [
  { key: "sheet", label: "시트", width: "16%", secondary: true, nowrap: true },
  { key: "rowNumber", label: "행", width: "8%", nowrap: true },
  { key: "managementNumber", label: "관리번호", width: "14%", nowrap: true },
  { key: "title", label: "도서명", width: "26%" },
  { key: "message", label: "내용", width: "36%", secondary: true },
];

/** 오류 목록 6컬럼. `message`는 renderCell이 danger 색을 입힌다(여기서 색을 정하지 않는다). */
export const IMPORT_ERROR_COLUMNS: DataTableColumn<ExcelImportRowResult>[] = [
  { key: "sheet", label: "시트", width: "14%", secondary: true, nowrap: true },
  { key: "rowNumber", label: "행", width: "7%", nowrap: true },
  { key: "managementNumber", label: "관리번호", width: "13%", nowrap: true },
  { key: "title", label: "도서명", width: "20%" },
  { key: "errorField", label: "필드", width: "12%", secondary: true },
  { key: "message", label: "내용", width: "34%" },
];
