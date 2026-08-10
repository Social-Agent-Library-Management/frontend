import type * as React from "react";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export interface PagePlaceholderProps extends React.ComponentProps<"div"> {
  /** 화면 이름. `<h1>`으로 렌더된다. */
  title: string;
  /** 안내 문구. 기본값 "이 화면은 준비 중입니다." */
  description?: string;
}

/**
 * 아직 구현되지 않은 화면의 빈 상태.
 *
 * 화면 구현 전 스캐폴딩이다 — 모든 화면이 구현되어 사용처가 0이 되면 삭제한다.
 * 제목 영역은 `PageHeader`, 흰 표면 컨테이너는 `Card`를 재사용한다(직접 만들지 말 것).
 * 페이지 여백은 `src/app/layout.tsx`의 `<main>`이 소유한다.
 */
export function PagePlaceholder({
  className,
  title,
  description = "이 화면은 준비 중입니다.",
  ...props
}: PagePlaceholderProps) {
  return (
    <div className={className} {...props}>
      <PageHeader title={title} />
      <Card padding="lg">
        <p className="text-body leading-normal text-fg-muted">{description}</p>
      </Card>
    </div>
  );
}
