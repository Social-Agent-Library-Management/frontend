import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * 아이콘/이니셜을 담는 정사각 컨테이너.
 *
 * 원본 디자인에서 4곳(StatCard 48px 원형, DdayCard 40px 라운드사각,
 * Sidebar 로고 40px, Sidebar 아바타 36px 원형)이 같은 구조를 반복해 추출했다.
 *
 * 배경/전경색은 variant가 아니라 `className`으로 주입한다
 * (`bg-primary-light text-primary`). 색 조합이 소비자마다 달라
 * cva 축으로 묶으면 조합 폭발이 일어나기 때문이다.
 * 내부 SVG는 `stroke="currentColor"`이므로 여기 준 `text-*`가 아이콘 색이 된다.
 */
export const iconBoxVariants = cva(
  "inline-flex items-center justify-center shrink-0",
  {
    variants: {
      size: {
        sm: "size-9", // 36px
        md: "size-10", // 40px
        lg: "size-12", // 48px
      },
      shape: {
        circle: "rounded-full",
        rounded: "rounded-dday", // 8px
      },
    },
    defaultVariants: {
      size: "md",
      shape: "circle",
    },
  },
);

export interface IconBoxProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof iconBoxVariants> {
  children?: React.ReactNode;
}

export function IconBox({
  className,
  size,
  shape,
  children,
  ...props
}: IconBoxProps) {
  return (
    <div className={cn(iconBoxVariants({ size, shape }), className)} {...props}>
      {children}
    </div>
  );
}
