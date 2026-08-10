import type * as React from "react";

import { cn } from "@/lib/utils";

export interface PageHeaderProps extends React.ComponentProps<"header"> {
  /** 화면 이름. `<h1>`으로 렌더된다. 페이지당 정확히 1개만 사용할 것. */
  title: string;
  /** 제목 아래 보조 설명 */
  description?: string;
  /** 우측 액션 슬롯 — 버튼·링크 등 */
  actions?: React.ReactNode;
}

/**
 * 모든 화면 상단의 제목 영역.
 *
 * 페이지 좌우/상하 여백은 포함하지 않는다 — `src/app/layout.tsx`의 `<main>`이 소유한다.
 * 화면마다 `<h1>` 마크업을 다시 쓰지 말고 이 컴포넌트를 합성한다.
 */
export function PageHeader({
  className,
  title,
  description,
  actions,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn("mb-6 flex items-start justify-between gap-4", className)}
      {...props}
    >
      <div className="min-w-0">
        <h1 className="text-3xl leading-tight font-bold tracking-tight text-fg">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-body leading-normal text-fg-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
