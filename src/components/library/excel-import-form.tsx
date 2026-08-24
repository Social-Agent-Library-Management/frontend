"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExcelFileDropzone } from "@/components/library/excel-file-dropzone";

export interface ExcelImportFormProps {
  file: File | null;
  uploading: boolean;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  /** "엑셀 파일 등록" 제출 */
  onSubmit: () => void;
  className?: string;
}

/**
 * 엑셀 일괄 등록 폼.
 *
 * 상태는 소유하지 않는다 — `ExcelImportSection`이 전부 들고 값과 콜백만 내려온다.
 * 안내 문구에 서버 enum(`INVALID_FILE_TYPE` 등)을 노출하지 않는다 — 사용자에게 보이는 건
 * 항상 `error.detail`이라는 코드베이스 관례를 따른다.
 */
export function ExcelImportForm({
  file,
  uploading,
  onFileSelect,
  onClear,
  onSubmit,
  className,
}: ExcelImportFormProps) {
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Card title="엑셀 파일" className="mb-5">
        <ExcelFileDropzone
          file={file}
          uploading={uploading}
          onFileSelect={onFileSelect}
          onClear={onClear}
        />
      </Card>

      <ul className="mb-5 list-none text-sm leading-relaxed text-fg-muted">
        <li>
          · 도서명 + 출판사 + 저자가 모두 같으면 동일 도서로 보고 소장본만 추가합니다
        </li>
        <li>· 엑셀 머리글 — 필수: 도서번호, 도서명 · 선택: 출판사명, 저자명</li>
        <li>
          · 파일 형식이 다르거나, 읽을 수 없거나, 필수 컬럼이 없거나, 20MB를
          초과하면 업로드가 즉시 거부됩니다
        </li>
      </ul>

      <div className="flex justify-end">
        {/* Button의 type 기본값이 "button"이라 제출 버튼에는 반드시 명시한다. */}
        <Button
          type="submit"
          variant="primary"
          disabled={file === null || uploading}
          aria-busy={uploading}
        >
          {uploading ? "업로드 중…" : "엑셀 파일 등록"}
        </Button>
      </div>
    </form>
  );
}
