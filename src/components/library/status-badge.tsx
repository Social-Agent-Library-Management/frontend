import type * as React from "react";

import { Badge, type BadgeTone } from "@/components/ui/badge";

export type BookStatus =
  | "available"
  | "loaned"
  | "overdue"
  | "returned"
  | "lost"
  | "disposed"
  | "copy";

const STATUS_MAP: Record<BookStatus, { tone: BadgeTone; label: string }> = {
  available: { tone: "success", label: "대출가능" },
  loaned: { tone: "warning", label: "대출중" },
  overdue: { tone: "danger", label: "연체" },
  returned: { tone: "neutral", label: "반납완료" },
  lost: { tone: "danger", label: "분실" },
  disposed: { tone: "muted", label: "폐기" },
  copy: { tone: "copy", label: "소장본" },
};

export interface StatusBadgeProps
  extends Omit<React.ComponentProps<typeof Badge>, "children" | "variant" | "tone"> {
  /**
   * 도서/소장본 상태.
   * 원본은 `'available'` 기본값을 뒀지만, 상태 누락이 "대출가능"으로 조용히
   * 표시되는 것은 도서 관리 시스템에서 위험하므로 필수 prop으로 승격했다.
   */
  status: BookStatus;
  /** 기본 한글 라벨 오버라이드 */
  label?: string;
}

/**
 * 도서 상태 배지 — 도메인 매핑 계층.
 *
 * 형태는 `ui/badge.tsx`가 담당하고, 여기서는 상태 → (tone, 한글 라벨)만 정한다.
 * `ui/`에는 도메인 지식을 두지 않는다는 규약(components/README.md) 때문이다.
 */
export function StatusBadge({ status, label, ...props }: StatusBadgeProps) {
  const config = STATUS_MAP[status];

  return (
    <Badge variant="soft" tone={config.tone} {...props}>
      {label ?? config.label}
    </Badge>
  );
}
