import type * as React from "react";

import { cn } from "@/lib/utils";

type CardPadding = "sm" | "md" | "lg";

/** 헤더 좌우 패딩 (수직은 pt-5 pb-4 고정) */
const HEADER_PADDING_X: Record<CardPadding, string> = {
  sm: "px-4",
  md: "px-6",
  lg: "px-8",
};

/** 헤더가 있을 때의 본문 패딩 — 상단은 헤더 구분선과의 간격 16px 고정 */
const CONTENT_PADDING_WITH_HEADER: Record<CardPadding, string> = {
  sm: "px-4 pt-4 pb-4",
  md: "px-6 pt-4 pb-6",
  lg: "px-8 pt-4 pb-8",
};

/** 헤더가 없을 때의 본문 패딩 */
const CONTENT_PADDING: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export interface CardProps extends React.ComponentProps<"div"> {
  /** 헤더에 렌더되는 섹션 제목 (구분선 포함) */
  title?: string;
  /** 헤더 우측 슬롯 — 카운트 배지·링크 등 */
  titleRight?: React.ReactNode;
  /** 제목 요소 레벨. 문서 개요에 맞춰 호출부가 고른다. */
  titleAs?: "h2" | "h3";
  /** 본문 내부 패딩: sm=16 / md=24 / lg=32px */
  padding?: CardPadding;
  /** 본문 패딩 제거 — 표·지도처럼 가장자리까지 차야 하는 콘텐츠용 */
  noPadding?: boolean;
}

/**
 * 흰 표면 컨테이너. 대시보드 패널·폼·표의 기본 래퍼.
 *
 * 그림자를 쓰지 않는다("No drop shadows" 디자인 원칙).
 * 원본의 `style?: React.CSSProperties`는 `className`으로 대체했다(하드코딩 방지).
 * `React.ComponentProps<'div'>` 상속 덕에 `style`도 여전히 전달은 가능하다.
 */
export function Card({
  className,
  title,
  titleRight,
  titleAs: TitleTag = "h2",
  padding = "md",
  noPadding = false,
  children,
  ...props
}: CardProps) {
  const contentClass = noPadding
    ? undefined
    : title
      ? CONTENT_PADDING_WITH_HEADER[padding]
      : CONTENT_PADDING[padding];

  return (
    <div
      className={cn("overflow-hidden rounded-card bg-surface", className)}
      {...props}
    >
      {title ? (
        <div
          className={cn(
            "flex items-center justify-between border-b border-line pt-5 pb-4",
            HEADER_PADDING_X[padding],
          )}
        >
          {/* 원본은 <span>이라 스크린리더에 섹션 구조가 전달되지 않았다 */}
          <TitleTag className="text-xl leading-snug font-semibold tracking-tight text-fg">
            {title}
          </TitleTag>
          {titleRight !== undefined ? (
            <div className="shrink-0">{titleRight}</div>
          ) : null}
        </div>
      ) : null}

      <div className={contentClass}>{children}</div>
    </div>
  );
}
