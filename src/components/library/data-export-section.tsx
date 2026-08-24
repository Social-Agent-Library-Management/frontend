"use client";

import * as React from "react";

import { Toast, type ToastTone } from "@/components/ui/toast";
import { ExportOptionsCard } from "@/components/library/export-options-card";
import { ExportSheetSelectCard } from "@/components/library/export-sheet-select-card";
import {
  DATE_RANGE_ERROR_MESSAGE,
  DEFAULT_EXPORT_OPTIONS,
  DEFAULT_EXPORT_SHEETS,
  estimateExportFileName,
  isInvalidDateRange,
  toExportRequest,
  type ExportOptionsValue,
} from "@/components/library/export-options";
import { isApiError } from "@/lib/api/client";
import { exportExcel, type ExportSheet } from "@/lib/api/excel";
import { downloadBlob } from "@/lib/download";

export interface DataExportSectionProps {
  className?: string;
}

type ToastState = { open: boolean; tone: ToastTone; message: string };

const CLOSED_TOAST: ToastState = {
  open: false,
  tone: "success",
  message: "",
};

/* ── 예상 파일명: 클라이언트 전용 값 ─────────────────────────────
   렌더 중에 `estimateExportFileName()`을 부르면 이 화면이 프리렌더될 때 **빌드 시점 날짜**가
   HTML에 박히고, 하이드레이션에서 클라이언트의 오늘 날짜와 어긋난다(서버 타임존이 UTC면
   KST 저녁에도 하루 어긋난다 — `estimateExportFileName`이 `toISOString()`을 피한 것과 같은 이유).
   `useSyncExternalStore`로 server snapshot("")과 client snapshot을 분리하면 불일치 없이
   마운트 직후 실제 로컬 날짜가 들어온다. getSnapshot은 안정된 값을 돌려줘야 하므로 캐시한다. */

/** 값이 바뀌지 않으므로 구독하지 않는다. */
const subscribeToNothing = () => () => {};

let cachedEstimatedFileName: string | null = null;

function getEstimatedFileName(): string {
  cachedEstimatedFileName ??= estimateExportFileName();
  return cachedEstimatedFileName;
}

/** 서버 렌더에는 날짜를 싣지 않는다. */
const getServerEstimatedFileName = () => "";

/**
 * 내보내기 화면의 클라이언트 경계이자 유일한 상태 소유자.
 *
 * `<form>`은 이 섹션이 소유하고 카드 2개를 함께 감싼다 — `ExportOptionsCard` 안에 폼을 만들면
 * 중첩 폼이 된다. 목록이 없으므로 `refreshToken` 패턴은 쓰지 않는다.
 */
export function DataExportSection({ className }: DataExportSectionProps) {
  const [selected, setSelected] = React.useState<Set<ExportSheet>>(
    () => new Set(DEFAULT_EXPORT_SHEETS),
  );
  const [options, setOptions] = React.useState<ExportOptionsValue>(
    DEFAULT_EXPORT_OPTIONS,
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [toast, setToast] = React.useState<ToastState>(CLOSED_TOAST);

  // 표시 전용 값이다 — 실제 다운로드 파일명은 서버 `Content-Disposition`에서 온다(위 주석 참고).
  const estimatedFileName = React.useSyncExternalStore(
    subscribeToNothing,
    getEstimatedFileName,
    getServerEstimatedFileName,
  );

  const invalidRange = isInvalidDateRange(
    options.loanDateFrom,
    options.loanDateTo,
  );
  const submitDisabled = selected.size === 0 || invalidRange;

  function toggleSheet(sheet: ExportSheet) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sheet)) {
        next.delete(sheet);
      } else {
        next.add(sheet);
      }
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitDisabled || submitting) return;
    setSubmitting(true);
    try {
      const { blob, filename } = await exportExcel(
        toExportRequest(selected, options),
      );
      downloadBlob(blob, filename);
      setToast({
        open: true,
        tone: "success",
        message: `${filename} 파일을 다운로드했습니다.`,
      });
    } catch (error) {
      // 서버 400(NO_SHEET_SELECTED / INVALID_DATE_RANGE) 폴백 포함.
      setToast({
        open: true,
        tone: "danger",
        message: isApiError(error)
          ? error.detail
          : "내보내기에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={className} onSubmit={handleSubmit}>
      {/* 디자인의 flex:2 1 520px / 1 1 360px. flex-wrap이 좁은 뷰포트에서 세로 스택을 만든다. */}
      <div className="flex flex-wrap gap-5">
        <ExportSheetSelectCard
          className="min-w-0 basis-[520px] grow-[2]"
          selected={selected}
          onToggle={toggleSheet}
        />
        <ExportOptionsCard
          className="min-w-0 basis-[360px] grow"
          value={options}
          onChange={setOptions}
          dateRangeError={invalidRange ? DATE_RANGE_ERROR_MESSAGE : undefined}
          estimatedFileName={estimatedFileName}
          submitting={submitting}
          submitDisabled={submitDisabled}
        />
      </div>

      <Toast
        open={toast.open}
        tone={toast.tone}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </form>
  );
}
