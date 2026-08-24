"use client";

import * as React from "react";

import { Toast, type ToastTone } from "@/components/ui/toast";
import { ExcelImportForm } from "@/components/library/excel-import-form";
import { ExcelImportResult } from "@/components/library/excel-import-result";
import { isApiError } from "@/lib/api/client";
import { importExcel, type ExcelImportOutcome } from "@/lib/api/excel";

export interface ExcelImportSectionProps {
  className?: string;
}

type ToastState = { open: boolean; tone: ToastTone; message: string };

const CLOSED_TOAST: ToastState = {
  open: false,
  tone: "success",
  message: "",
};

/**
 * 엑셀 일괄 등록 화면의 클라이언트 경계이자 유일한 상태 소유자.
 *
 * 페이지(`src/app/admin/excel-import/page.tsx`)는 `metadata`를 export해야 하므로 서버 컴포넌트로
 * 남는다. 폼·결과를 페이지에서 직접 배치하지 말 것.
 *
 * `CopyRegisterSection`류의 "폼 + 목록 refreshToken" 패턴이 **아니다** — 목록이 없고
 * 폼↔결과가 배타 전환된다. `refreshToken`을 배선하지 말 것.
 *
 * `phase` 문자열 enum도 두지 않는다 — idle/picked/uploading/success/error가 아래 3개 상태의
 * 조합으로 전부 파생된다(idle = `file===null && result===null`, …). 상태를 이중으로 들면
 * 두 진실이 어긋난다.
 */
export function ExcelImportSection({ className }: ExcelImportSectionProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  // 결과와 그때의 파일명을 함께 묶는다 — 리셋 후에도 배너 문구가 흔들리지 않는다.
  const [result, setResult] = React.useState<{
    outcome: ExcelImportOutcome;
    fileName: string;
  } | null>(null);
  const [toast, setToast] = React.useState<ToastState>(CLOSED_TOAST);

  async function handleSubmit() {
    if (file === null || uploading) return;
    setUploading(true);
    try {
      const outcome = await importExcel(file);
      // 201(committed)·409(rejected) 모두 정상 결과다.
      setResult({ outcome, fileName: file.name });
    } catch (error) {
      // 400/413 — 토스트로만 알리고 선택된 파일은 유지한다(재선택 없이 재시도 가능).
      setToast({
        open: true,
        tone: "danger",
        message: isApiError(error)
          ? error.detail
          : "엑셀 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setUploading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    // warnOpen은 ExcelImportResult 언마운트로 자동 소멸한다.
  }

  return (
    <div className={className}>
      {result === null ? (
        <ExcelImportForm
          file={file}
          uploading={uploading}
          onFileSelect={setFile}
          onClear={() => setFile(null)}
          onSubmit={handleSubmit}
        />
      ) : (
        <ExcelImportResult
          outcome={result.outcome}
          fileName={result.fileName}
          onReset={handleReset}
        />
      )}

      <Toast
        open={toast.open}
        tone={toast.tone}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
