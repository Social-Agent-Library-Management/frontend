import type * as React from "react";

import { cn } from "@/lib/utils";
import { IconBox } from "@/components/ui/icon-box";

type StatTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "copy"
  | "neutral";
type StatSubTone = "muted" | "success" | "warning" | "danger" | "primary";

const ICON_TONE: Record<StatTone, string> = {
  primary: "bg-primary-light text-primary",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  danger: "bg-danger-light text-danger",
  copy: "bg-copy-light text-copy",
  neutral: "bg-canvas text-fg-muted",
};

const SUB_TONE: Record<StatSubTone, string> = {
  muted: "text-fg-muted",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  primary: "text-primary",
};

export interface StatCardProps extends React.ComponentProps<"article"> {
  /** 지표 라벨 (예: "전체 도서") */
  label: string;
  /** 표시값. 숫자 포맷팅(`toLocaleString()`)은 호출부 책임이다. */
  value: string | number;
  /** 보조 문구 (예: "+12 이번 달") */
  sub?: string;
  /** 아이콘 노드 (SVG) */
  icon?: React.ReactNode;
  /**
   * 아이콘 원의 색 조합.
   * 원본 `iconBg?: string`(임의 CSS 색 문자열)을 토큰 축으로 교체했다.
   */
  tone?: StatTone;
  /** 보조 문구 색. 원본 `subColor?: string` 대체. */
  subTone?: StatSubTone;
}

/**
 * 대시보드 KPI 카드. 원형 아이콘 + 큰 수치 + 보조 문구.
 * 아이콘 컨테이너는 `ui/icon-box.tsx`를 재사용한다.
 */
export function StatCard({
  className,
  label,
  value,
  sub,
  icon,
  tone = "primary",
  subTone = "muted",
  ...props
}: StatCardProps) {
  return (
    <article
      className={cn(
        "flex min-w-0 flex-1 items-center gap-4 rounded-card bg-surface px-6 py-5",
        className,
      )}
      {...props}
    >
      <IconBox
        size="lg"
        shape="circle"
        aria-hidden="true"
        className={ICON_TONE[tone]}
      >
        {icon}
      </IconBox>

      <div className="min-w-0 flex-1">
        <p className="mb-1 truncate text-base leading-snug tracking-normal text-fg-muted">
          {label}
        </p>
        <p className="text-3xl leading-none font-bold tracking-tight text-fg">
          {value}
        </p>
        {sub ? (
          <p
            className={cn(
              "mt-1.25 truncate text-sm leading-snug",
              SUB_TONE[subTone],
            )}
          >
            {sub}
          </p>
        ) : null}
      </div>
    </article>
  );
}
