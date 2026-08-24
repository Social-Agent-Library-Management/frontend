import type * as React from "react";

import { Card } from "@/components/ui/card";
import { IconBox } from "@/components/ui/icon-box";
import { IconCheck, IconClose, type SizedIconProps } from "@/components/icons";

export type ImportResultTone = "success" | "danger";

export interface ImportResultBannerProps {
  tone: ImportResultTone;
  /** 굵은 한 줄 요약 */
  title: string;
  /** 그 아래 보조 문구 */
  description: string;
  /** 결과 전환 시 포커스를 옮기기 위한 ref (제목 요소에 연결된다) */
  titleRef?: React.Ref<HTMLHeadingElement>;
  className?: string;
}

/**
 * 색 조합은 `IconBox` 규약대로 **className으로 주입**한다(`StatCard.ICON_TONE`과 동일 방식).
 * cva를 별도로 두지 않는 이유: 축이 하나고 아이콘 컴포넌트까지 함께 골라야 해서
 * `Record` 매핑이 더 정확하다(`StatCard`·`status-badge` 선례).
 */
const BANNER_TONE: Record<
  ImportResultTone,
  { box: string; Icon: React.ComponentType<SizedIconProps> }
> = {
  success: { box: "bg-success-light text-success", Icon: IconCheck },
  danger: { box: "bg-danger-light text-danger", Icon: IconClose },
};

/**
 * 엑셀 등록 결과 배너(성공/오류 공용).
 *
 * 구조(아이콘 원 + 타이틀 + 서브)가 완전히 같고 `tone`만 다르므로 단일 구현이다.
 * **화면에서 결과 배너를 다시 마크업하지 말 것.**
 *
 * 접근성: 결과 블록은 폼을 대체하며 나중에 DOM에 삽입되므로 live region으로는 낭독되지 않는다
 * (`Toast` 소스 주석과 같은 이유). 대신 소비자(`ExcelImportResult`)가 마운트 시
 * `titleRef.current?.focus()`로 포커스를 옮긴다 — `tabIndex={-1}`이 그래서 있다.
 */
export function ImportResultBanner({
  tone,
  title,
  description,
  titleRef,
  className,
}: ImportResultBannerProps) {
  const { box, Icon } = BANNER_TONE[tone];

  return (
    <Card className={className}>
      <div className="flex items-center gap-3.5">
        <IconBox size="lg" shape="card" aria-hidden="true" className={box}>
          <Icon size={24} />
        </IconBox>
        <div className="min-w-0">
          <h2
            ref={titleRef}
            tabIndex={-1}
            className="text-xl leading-snug font-bold tracking-tight text-fg focus-ring"
          >
            {title}
          </h2>
          <p className="mt-0.5 text-base leading-cozy text-fg-muted">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
}
