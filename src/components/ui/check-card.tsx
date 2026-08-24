"use client";

import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

export interface CheckCardProps {
  /** controlled 상태 */
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** 굵은 제목 (예: "도서") */
  label: string;
  /** 라벨 아래 보조 설명 (예: 컬럼 목록). `aria-describedby`로 체크박스에 연결된다 */
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const checkCardVariants = cva(
  [
    "flex w-full cursor-pointer items-start gap-2.5 rounded-tile border px-4 py-3.5",
    "transition-colors duration-150",
  ],
  {
    variants: {
      checked: {
        true: "border-primary bg-primary-light",
        false: "border-line bg-surface hover:bg-surface-muted",
      },
    },
    defaultVariants: { checked: false },
  },
);

/**
 * 체크박스 + 라벨 + 설명을 담는 선택 가능한 카드형 행.
 *
 * 맨 체크박스(`Checkbox`) 프리미티브를 따로 두지 않는다 — 카드가 아닌 사용처가 코드베이스에
 * 0곳이다(`LoanHistoryCard`의 네이티브 `<select>`를 `ui/select.tsx`로 승격하지 않은 것과 같은 판단).
 * 두 번째 사용처가 생기면 그때 이 파일에서 `Checkbox`를 추출한다.
 *
 * 네이티브 `<input type="checkbox">`를 감춘 커스텀 박스로 바꾸지 말 것 — 디자인 원본도
 * 15px 네이티브 체크박스(`accentColor`)다.
 */
export function CheckCard({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className,
}: CheckCardProps) {
  const generatedId = React.useId();
  const controlId = id ?? generatedId;
  const descriptionId = `${controlId}-description`;

  return (
    <label className={cn(checkCardVariants({ checked }), className)}>
      <input
        type="checkbox"
        id={controlId}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={description ? descriptionId : undefined}
        className="mt-0.5 size-3.75 shrink-0 accent-primary focus-ring"
      />
      <span className="min-w-0">
        <span className="block text-md leading-cozy font-semibold text-fg">
          {label}
        </span>
        {description ? (
          <span
            id={descriptionId}
            className="mt-1 block text-sm leading-relaxed text-fg-muted"
          >
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
