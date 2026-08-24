"use client";

import * as React from "react";
import { cva } from "class-variance-authority";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ExcelFileDropzoneProps {
  /** 선택된 파일. null이면 드롭존, 아니면 선택 파일 행을 렌더한다 */
  file: File | null;
  onFileSelect: (file: File) => void;
  /** "제거" — file을 null로 되돌린다 */
  onClear: () => void;
  /** 업로드 중. 드롭·선택·제거를 막고 우측에 "업로드 중…"을 노출한다 */
  uploading?: boolean;
  className?: string;
}

const dropzoneVariants = cva(
  [
    "flex flex-col items-center gap-1.5 rounded-card border-[1.5px] border-dashed px-6 py-11 text-center",
    "transition-colors duration-150",
  ],
  {
    variants: {
      dragging: {
        true: "border-primary bg-primary-light",
        false: "border-line bg-canvas",
      },
    },
    defaultVariants: { dragging: false },
  },
);

/** 사용처가 1곳이라 `lib/`로 올리지 않는다. */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * 엑셀 파일 피커 — drag&drop + 숨긴 file input + 선택 파일 표시 행.
 *
 * **클라이언트 사전 검증을 넣지 말 것**: 확장자·20MB 초과를 프론트에서 거르지 않는다.
 * 서버가 `INVALID_FILE_TYPE`/`FILE_TOO_LARGE`를 권위 있게 판정하고 결과는 Toast로 노출된다
 * (`bookitems.ts`의 "검증 주체는 서버다 — 프론트에 정규식을 복제하지 않는다"와 동일 원칙).
 * `accept=".xlsx,.xls"`는 파일 선택 다이얼로그 힌트일 뿐이다.
 */
export function ExcelFileDropzone({
  file,
  onFileSelect,
  onClear,
  uploading = false,
  className,
}: ExcelFileDropzoneProps) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped && !uploading) onFileSelect(dropped);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    // 같은 파일을 제거 후 다시 고르면 change가 발화하지 않는다 — 매번 비운다.
    event.target.value = "";
    if (picked) onFileSelect(picked);
  }

  if (file !== null) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 rounded-tile bg-primary-light px-4 py-3.5",
          className,
        )}
      >
        <div className="min-w-0">
          <p className="truncate text-md font-semibold text-fg">{file.name}</p>
          <p className="mt-0.5 text-sm text-fg-muted">
            {formatFileSize(file.size)}
          </p>
        </div>
        {uploading ? (
          <span className="shrink-0 text-base font-semibold text-primary">
            업로드 중…
          </span>
        ) : (
          <Button variant="ghost" size="sm" onClick={onClear}>
            제거
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3.5", className)}>
      {/*
        드롭존 div에 role="button"을 붙이지 않는다 — 키보드 경로는 아래 실제 <Button>이
        담당한다. 둘 다 노출하면 스크린리더에 같은 액션이 중복된다.
      */}
      <div
        className={dropzoneVariants({ dragging })}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <p className="text-body font-semibold text-fg">
          파일을 끌어다 놓거나 아래에서 선택하세요
        </p>
        <p className="text-base text-fg-muted">
          .xlsx · .xls · 최대 20MB · 첫 행은 머리글로 처리됩니다
        </p>
      </div>
      <div>
        <Button
          variant="ghost"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          파일 선택
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="sr-only"
        aria-label="엑셀 파일 선택"
        onChange={handleInputChange}
      />
    </div>
  );
}
