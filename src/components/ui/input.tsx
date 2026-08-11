"use client";

import type * as React from "react";
import { cva } from "class-variance-authority";

import { Field, useFieldIds } from "@/components/ui/field";

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

/**
 * 텍스트 입력 필드.
 *
 * 라벨/힌트/에러 껍데기와 id·aria 배선은 `ui/field.tsx`에 위임한다
 * (`Combobox`가 같은 껍데기를 쓴다 — 복제하면 두 필드의 에러 표기가 갈라진다).
 * 이 파일은 입력창 자체의 스타일(`inputVariants`)만 소유한다.
 */
export function Input({
  className,
  label,
  hint,
  error,
  required,
  id,
  ...props
}: InputProps) {
  const { controlId, describedBy, invalid } = useFieldIds(id, { hint, error });

  return (
    <Field
      className={className}
      controlId={controlId}
      label={label}
      required={required}
      hint={hint}
      error={error}
    >
      <input
        id={controlId}
        required={required}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={inputVariants({ invalid })}
        {...props}
      />
    </Field>
  );
}
