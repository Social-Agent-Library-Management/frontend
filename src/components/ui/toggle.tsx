"use client";

import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

export interface ToggleProps {
  /** controlled 상태 */
  checked: boolean;
  /** 다음 상태를 인자로 받는다(이벤트 객체가 아니다 — 네이티브 input이 아니므로) */
  onChange: (checked: boolean) => void;
  /** 스위치 우측 라벨. 클릭하면 스위치가 토글된다 */
  label: string;
  disabled?: boolean;
  /** 지정하지 않으면 `React.useId()`로 파생 */
  id?: string;
  /** 바깥 래퍼에 붙는다 */
  className?: string;
}

/**
 * on/off 스위치.
 *
 * 트랙과 손잡이가 **서로 다른 요소**라 cva를 둘로 나눈다 — 한 요소에 두 축을 얹는 게 아니라
 * 두 요소가 같은 `checked` 축을 각자 소비한다.
 * 치수는 전부 4px 그리드 위에 있다(트랙 38×22, 손잡이 18, 오프셋 2/18) — 신규 토큰 불필요.
 */
export const toggleTrackVariants = cva(
  [
    "relative inline-flex h-5.5 w-9.5 shrink-0 rounded-full",
    "transition-colors duration-150 cursor-pointer focus-ring",
    "disabled:cursor-not-allowed disabled:opacity-42",
  ],
  {
    variants: {
      checked: { true: "bg-primary", false: "bg-line" },
    },
    defaultVariants: { checked: false },
  },
);

export const toggleThumbVariants = cva(
  [
    "absolute top-0.5 size-4.5 rounded-full bg-surface shadow-sm transition-[left] duration-150",
  ],
  {
    variants: {
      checked: { true: "left-4.5", false: "left-0.5" },
    },
    defaultVariants: { checked: false },
  },
);

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  className,
}: ToggleProps) {
  const generatedId = React.useId();
  const controlId = id ?? generatedId;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/*
        네이티브 체크박스를 감춰 흉내내지 않고 `role="switch"` 버튼으로 만든다 —
        on/off 의미가 스크린리더에 정확히 전달되고, 포커스 스타일은 기존 `focus-ring`을 재사용한다.
        `<button>`은 labelable 요소라 아래 `<label htmlFor>`가 유효하다(라벨 클릭 = 토글).
      */}
      <button
        type="button"
        id={controlId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={toggleTrackVariants({ checked })}
      >
        <span aria-hidden="true" className={toggleThumbVariants({ checked })} />
      </button>
      <label
        htmlFor={controlId}
        className="cursor-pointer text-base leading-cozy text-fg-muted"
      >
        {label}
      </label>
    </div>
  );
}
