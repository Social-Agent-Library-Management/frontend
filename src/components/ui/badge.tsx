import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * pill 형태 배지 — **형태 프리미티브**. 도메인 어휘를 담지 않는다.
 *
 * `soft`(연한 배경 + 진한 텍스트)와 `solid`(진한 배경 + 흰 텍스트)는 색 모델만
 * 다르고 형태·정렬·radius가 같아 한 컴포넌트로 통합했다.
 * → 상태 배지는 `library/status-badge.tsx`, D-day pill은 `library/dday-card.tsx`가
 *   이 컴포넌트를 합성한다.
 */
export const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-badge tracking-normal whitespace-nowrap leading-none shrink-0",
  {
    variants: {
      variant: {
        soft: "font-medium",
        solid: "font-semibold text-fg-inverse",
      },
      tone: {
        neutral: "",
        primary: "",
        success: "",
        warning: "",
        danger: "",
        copy: "",
        muted: "",
      },
      size: {
        sm: "h-4.5 px-1.75 text-2xs", // 18 / 7 / 10px
        md: "h-5.5 px-2.5 text-xs", // 22 / 10 / 11px
        lg: "h-6.5 px-3 text-base", // 26 / 12 / 13px
      },
    },
    compoundVariants: [
      { variant: "soft", tone: "neutral", class: "bg-canvas text-fg-muted" },
      {
        variant: "soft",
        tone: "primary",
        class: "bg-primary-light text-primary",
      },
      {
        variant: "soft",
        tone: "success",
        class: "bg-success-light text-success",
      },
      {
        variant: "soft",
        tone: "warning",
        class: "bg-warning-light text-warning",
      },
      { variant: "soft", tone: "danger", class: "bg-danger-light text-danger" },
      { variant: "soft", tone: "copy", class: "bg-copy-light text-copy" },
      { variant: "soft", tone: "muted", class: "bg-canvas text-fg-subtle" },

      { variant: "solid", tone: "neutral", class: "bg-fg-muted" },
      { variant: "solid", tone: "primary", class: "bg-primary" },
      { variant: "solid", tone: "success", class: "bg-success" },
      { variant: "solid", tone: "warning", class: "bg-warning" },
      { variant: "solid", tone: "danger", class: "bg-danger" },
      { variant: "solid", tone: "copy", class: "bg-copy" },
      { variant: "solid", tone: "muted", class: "bg-fg-subtle" },
    ],
    defaultVariants: {
      variant: "soft",
      tone: "neutral",
      size: "md",
    },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;
export type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>["size"]>;

export interface BadgeProps
  extends Omit<React.ComponentProps<"span">, "color">,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
}

export function Badge({
  className,
  variant,
  tone,
  size,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, tone, size }), className)}
      {...props}
    >
      {children}
    </span>
  );
}
