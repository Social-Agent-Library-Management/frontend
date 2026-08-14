"use client";

import type * as React from "react";
import { cva } from "class-variance-authority";

import { Field, useFieldIds } from "@/components/ui/field";

export const inputVariants = cva(
  [
    // ⚠️ base는 `pr-input-x`만 갖는다. 좌측 패딩은 `hasLeadingIcon` 축이 소유한다 —
    // cva는 클래스를 단순 연결하므로 base의 `px-input-x`와 variant의 `pl-9`를 함께 두면
    // 승패가 CSS 소스 순서에 걸려 불안정해진다.
    // `hasLeadingIcon: false`(기본) → `pl-input-x` + `pr-input-x` ≡ 종전 `px-input-x`.
    "h-11 w-full rounded-input border bg-surface pr-input-x text-body text-fg",
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
      hasLeadingIcon: {
        false: "pl-input-x",
        /** 14px(아이콘 left 오프셋) + 16px(아이콘 폭) + 6px(간격) = 36px */
        true: "pl-9",
      },
    },
    defaultVariants: {
      invalid: false,
      hasLeadingIcon: false,
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
  /**
   * 입력창 좌측 안쪽에 절대배치되는 **장식** 아이콘 (`aria-hidden` + `pointer-events-none`).
   * `Button.icon`과 같은 계약이다. 16px 아이콘 기준으로 좌측 패딩이 36px가 된다.
   * 클릭 가능한 아이콘(지우기 버튼 등)을 여기 넣지 말 것 — 그때는 별도 축을 설계한다.
   */
  leadingIcon?: React.ReactNode;
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
  leadingIcon,
  ...props
}: InputProps) {
  const { controlId, describedBy, invalid } = useFieldIds(id, { hint, error });

  const control = (
    <input
      id={controlId}
      required={required}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      className={inputVariants({
        invalid,
        hasLeadingIcon: Boolean(leadingIcon),
      })}
      {...props}
    />
  );

  return (
    <Field
      className={className}
      controlId={controlId}
      label={label}
      required={required}
      hint={hint}
      error={error}
    >
      {leadingIcon ? (
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-input-x flex -translate-y-1/2 items-center text-fg-muted"
          >
            {leadingIcon}
          </span>
          {control}
        </div>
      ) : (
        control
      )}
    </Field>
  );
}
