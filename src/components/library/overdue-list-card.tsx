import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DdayCard } from "@/components/library/dday-card";
import type { OverdueLoanSummary } from "@/lib/api/loans";

export interface OverdueListCardProps {
  /** 표시할 연체 건. 서버가 경과일 내림차순으로 잘라 내려준 그대로 렌더한다. */
  rows: OverdueLoanSummary[];
  /**
   * 연체 **전체** 건수. `rows.length`가 아니다 — 목록은 `OVERDUE_LIMIT`으로 잘려 있어서
   * 헤더 배지가 실제보다 적은 수를 말하게 된다.
   */
  totalCount: number;
  loading?: boolean;
  className?: string;
}

/**
 * 대시보드 "연체 목록" 카드 (`#37`).
 *
 * `RecentLoansCard`와 마찬가지로 조회를 소유하지 않는다(호출 1회를 `DashboardSection`이 소유).
 *
 * 헤더 우측 pill은 원본 디자인의 인라인 `<span>`(배경·radius·굵기 하드코딩)을 `ui/Badge`의
 * `variant="solid" tone="danger"`로 치환한 것이다 — 형태가 이미 Badge다.
 *
 * `<ul>/<li>` 래핑이 여기 있는 이유: `DdayCard`는 "리스트 래핑은 소비 화면의 책임"이라고
 * 명시한 프레젠테이션 카드다(리스트가 아닌 자리에도 쓰인다). 이 카드가 그 소비처다.
 */
export function OverdueListCard({
  rows,
  totalCount,
  loading = false,
  className,
}: OverdueListCardProps) {
  return (
    <Card
      title="연체 목록"
      titleAs="h2"
      titleRight={
        <Badge variant="solid" tone="danger" size="md">
          {totalCount}
        </Badge>
      }
      className={className}
    >
      {rows.length === 0 ? (
        // 표가 아니라 카드 본문이라 `DataTable`의 `emptyText` 자리가 없다.
        // 문구·여백은 `DataTable`의 빈 셀(py-12, text-body, text-fg-muted)에 맞춘다.
        <p className="px-4 py-12 text-center text-body text-fg-muted">
          {loading ? "불러오는 중…" : "연체된 대출이 없습니다."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.loanId}>
              <DdayCard
                title={row.bookTitle}
                meta={`${row.borrowerName} · ${row.department} · 반납예정: ${row.dueDate}`}
                // 서버의 `overdueDays`는 경과일(양수)이고 `DdayCard`는 남은 일수를 받는다.
                // 부호를 뒤집으면 `getUrgency`가 urgent로, `formatDday`가 `D+N`으로 그린다.
                daysLeft={-row.overdueDays}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
