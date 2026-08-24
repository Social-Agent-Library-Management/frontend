"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import type { ExportOptionsValue } from "@/components/library/export-options";

export interface ExportOptionsCardProps {
  value: ExportOptionsValue;
  onChange: (next: ExportOptionsValue) => void;
  /** from > to 인라인 에러 문구. 있으면 종료일 Input의 error로 붙는다 */
  dateRangeError?: string;
  /** 표시 전용 "예상 파일명" (실제 파일명은 서버가 결정) */
  estimatedFileName: string;
  /** 내보내기 진행 중 */
  submitting: boolean;
  /** 시트 0개 또는 날짜 범위 오류 — 버튼 disabled */
  submitDisabled: boolean;
  className?: string;
}

/**
 * 내보내기 옵션 카드.
 *
 * `onSubmit` prop이 없다 — 제출은 `DataExportSection`이 소유한 `<form>`이 받고 이 카드의
 * 버튼은 `type="submit"`이다. **이 컴포넌트 안에 `<form>`을 만들지 말 것**(중첩 폼은 무효).
 *
 * 날짜 `Input`에 `aria-describedby`를 직접 넘기지 말 것 — `Input`이 `useFieldIds`로 만든 값을
 * `...props` 스프레드가 덮어써서 `error` 연결이 끊긴다. 안내 문구는 시각 텍스트로만 둔다.
 */
export function ExportOptionsCard({
  value,
  onChange,
  dateRangeError,
  estimatedFileName,
  submitting,
  submitDisabled,
  className,
}: ExportOptionsCardProps) {
  return (
    <Card title="내보내기 옵션" className={className}>
      <div className="flex flex-col gap-4">
        <fieldset className="min-w-0 border-0 p-0">
          <legend className="mb-2 text-base leading-cozy font-semibold tracking-normal text-fg">
            대여 기간
          </legend>
          <div className="flex items-center gap-2">
            {/* Input의 className은 Field 래퍼로 전달되므로 min-w-0 flex-1이 올바른 자리다. */}
            <Input
              type="date"
              aria-label="대여 시작일"
              className="min-w-0 flex-1"
              value={value.loanDateFrom}
              onChange={(e) =>
                onChange({ ...value, loanDateFrom: e.target.value })
              }
            />
            <span aria-hidden="true" className="text-fg-subtle">
              ~
            </span>
            <Input
              type="date"
              aria-label="대여 종료일"
              className="min-w-0 flex-1"
              value={value.loanDateTo}
              error={dateRangeError}
              onChange={(e) =>
                onChange({ ...value, loanDateTo: e.target.value })
              }
            />
          </div>
          <p className="mt-1.5 text-sm leading-cozy text-fg-muted">
            대여 시트에만 적용됩니다
          </p>
        </fieldset>

        <div className="flex flex-col gap-2.5">
          <Toggle
            label="분실·폐기 소장본 포함"
            checked={value.includeInactiveItems}
            onChange={(next) =>
              onChange({ ...value, includeInactiveItems: next })
            }
          />
          <Toggle
            label="미반납 건만 내보내기"
            checked={value.unreturnedOnly}
            onChange={(next) => onChange({ ...value, unreturnedOnly: next })}
          />
        </div>

        <div className="rounded-button bg-canvas px-3.5 py-3">
          <p className="mb-1 text-sm leading-cozy text-fg-muted">예상 파일명</p>
          <p className="text-base leading-cozy font-semibold break-all text-fg">
            {estimatedFileName}
          </p>
        </div>

        {/* Button의 type 기본값이 "button"이라 제출 버튼에는 반드시 명시한다. */}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={submitDisabled || submitting}
          aria-busy={submitting}
        >
          {submitting ? "내보내는 중…" : "엑셀 내보내기"}
        </Button>
      </div>
    </Card>
  );
}
