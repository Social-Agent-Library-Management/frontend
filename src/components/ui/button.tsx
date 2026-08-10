"use client";

import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * 범용 액션 버튼.
 *
 * 원본의 `useState(hovered)` / `useState(pressed)`는 전부 삭제했다.
 * Tailwind의 `not-disabled:hover:*` / `not-disabled:active:*`가 같은 동작을
 * JS 없이 표현하며, disabled일 때 hover가 무시되는 것도 선택자 수준에서 성립한다.
 */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center rounded-button font-semibold",
    "tracking-normal leading-none whitespace-nowrap cursor-pointer",
    "transition-[background-color,opacity,transform] duration-150",
    "not-disabled:active:scale-97",
    "disabled:opacity-42 disabled:cursor-not-allowed",
    "focus-ring",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-fg-inverse not-disabled:hover:bg-primary-hover",
        // border-[1.5px]는 이 코드베이스에서 유일하게 허용하는 임의값이다.
        // Tailwind v4에는 border-width 테마 네임스페이스가 없어 토큰화 경로가 존재하지 않는다.
        secondary:
          "bg-surface text-primary border-[1.5px] border-primary not-disabled:hover:bg-primary-light",
        ghost:
          "bg-transparent text-fg border border-line not-disabled:hover:bg-surface-muted",
        danger: "bg-danger text-fg-inverse not-disabled:hover:bg-danger-hover",
        success:
          "bg-success text-fg-inverse not-disabled:hover:bg-success-hover",
      },
      size: {
        sm: "h-7.5 px-3 gap-1 text-sm", // 30 / 12 / 4 / 12px
        md: "h-10 px-4.5 gap-1.5 text-body", // 40 / 18 / 6 / 15px
        lg: "h-12 px-6 gap-2 text-lg", // 48 / 24 / 8 / 17px
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** 라벨 앞에 붙는 아이콘 노드 (장식용 — aria-hidden 처리된다) */
  icon?: React.ReactNode;
}

export function Button({
  className,
  variant,
  size,
  fullWidth,
  icon,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    >
      {icon ? (
        <span className="flex shrink-0 items-center" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}
