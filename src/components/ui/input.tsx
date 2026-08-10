"use client";

import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const inputVariants = cva(
  [
    "h-11 w-full rounded-input border bg-surface px-input-x text-body text-fg",
    "placeholder:text-fg-subtle outline-none",
    "transition-[border-color,box-shadow] duration-150",
    "disabled:bg-surface-muted disabled:opacity-55 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      invalid: {
        false: "border-line focus:border-primary focus:shadow-focus-ring",
        // 에러 상태에서는 포커스 링을 생략한다(원본 동작 유지 — 테두리 색만 danger).
        true: "border-danger focus:border-danger",
      },
    },
    defaultVariants: {
      invalid: false,
    },
  },
);

export interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  /** input 위에 렌더되는 라벨 */
  label?: string;
  /** input 아래 보조 설명 — error가 있으면 감춰진다 */
  hint?: string;
  /** 에러 메시지 — 있으면 hint 대신 노출되고 테두리가 danger가 된다 */
  error?: string;
}

export function Input({
  className,
  label,
  hint,
  error,
  required,
  id,
  ...props
}: InputProps) {
  // 원본은 모듈 전역 카운터(`let _idCounter = 0`)로 id를 만들었는데,
  // SSR과 CSR의 카운터 값이 어긋나 하이드레이션 미스매치를 낸다. useId()로 교체.
  const reactId = React.useId();
  const inputId = id ?? `input-${reactId}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const invalid = Boolean(error);

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="text-base leading-cozy font-semibold tracking-normal text-fg"
        >
          {label}
          {required ? (
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <input
        id={inputId}
        required={required}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : hint ? hintId : undefined}
        className={inputVariants({ invalid })}
        {...props}
      />

      {hint && !invalid ? (
        <span id={hintId} className="text-sm leading-cozy text-fg-muted">
          {hint}
        </span>
      ) : null}

      {invalid ? (
        <span id={errorId} className="text-sm leading-cozy text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
