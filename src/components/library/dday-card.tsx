import type * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { formatDday, getUrgency, type Urgency } from "@/lib/dday";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { IconBox } from "@/components/ui/icon-box";
import { IconCalendar } from "@/components/icons";

const ddayCardVariants = cva("flex items-center gap-3 rounded-dday p-4", {
  variants: {
    urgency: {
      urgent: "bg-urgent-bg",
      warning: "bg-warning-bg",
      normal: "bg-normal-bg",
    },
  },
  defaultVariants: {
    urgency: "normal",
  },
});

const ICON_TONE: Record<Urgency, string> = {
  urgent: "bg-danger-light text-danger",
  warning: "bg-warning-light text-warning",
  normal: "bg-line text-fg-muted",
};

const PILL_TONE: Record<Urgency, BadgeTone> = {
  urgent: "danger",
  warning: "warning",
  normal: "neutral",
};

export interface DdayCardProps extends React.ComponentProps<"article"> {
  /** 도서명 */
  title: string;
  /** 보조 정보 한 줄 — "대출자 · 부서 · 반납예정일" 사전 조합 문자열 */
  meta: string;
  /** 반납까지 남은 일수 (음수 = 연체) */
  daysLeft: number;
}

/**
 * 반납 기한 알림 카드. 남은 일수로 긴급도를 자동 색상화한다.
 *
 * D-day pill은 `ui/badge.tsx`를 `variant="solid"`로 합성한다 —
 * 원본에서 Badge와 이 pill은 색 모델만 다르고 형태가 같아 중복이었다.
 * 리스트에서 쓸 때 `<ul>/<li>` 래핑은 소비 화면의 책임이다.
 */
export function DdayCard({
  className,
  title,
  meta,
  daysLeft,
  ...props
}: DdayCardProps) {
  const urgency = getUrgency(daysLeft);

  return (
    <article className={cn(ddayCardVariants({ urgency }), className)} {...props}>
      <IconBox
        size="md"
        shape="rounded"
        aria-hidden="true"
        className={ICON_TONE[urgency]}
      >
        <IconCalendar />
      </IconBox>

      <div className="min-w-0 flex-1">
        <p className="mb-0.75 truncate text-md font-medium tracking-normal text-fg">
          {title}
        </p>
        <p className="truncate text-base leading-cozy text-fg-muted">{meta}</p>
      </div>

      <Badge
        variant="solid"
        tone={PILL_TONE[urgency]}
        size="lg"
        className="min-w-13"
      >
        {formatDday(daysLeft)}
      </Badge>
    </article>
  );
}
