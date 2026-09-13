import type * as React from "react";

import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyCell } from "@/components/ui/empty-cell";
import { StatusBadge } from "@/components/library/status-badge";
import {
  DASHBOARD_LOAN_COLUMNS,
  toLoanBadgeStatus,
} from "@/components/library/loan-table";
import type { LoanActivity } from "@/lib/api/loans";
import { formatRelativeTime } from "@/lib/relative-time";

export interface RecentLoansCardProps {
  /**
   * 이미 조회된 행. 서버가 **활동 시각(`activityAt`) 내림차순**으로 잘라 내려준
   * 그대로 렌더한다. 대출·반납이 섞인다.
   */
  rows: LoanActivity[];
  loading?: boolean;
  className?: string;
}

/**
 * 대시보드 "최근 활동" 카드 (`#37`, `#45`에서 최근 활동 조회로 전환).
 *
 * `#45`에서 서버가 "대여일 순 대출 목록"에서 "활동 시각 순 대출·반납 활동"으로 바뀌었다.
 * 컴포넌트·파일 이름은 `RecentLoansCard` 그대로 둔다 — prop 타입과 표시 문구만 바뀌는
 * 최소 변경이고, 리네이밍은 import 경로까지 흔들면서 얻는 게 이름뿐이다.
 *
 * **조회를 소유하지 않는다** — 대시보드는 `/dashboard/summary` 한 번으로 화면 전체를 받으므로
 * 카드가 각자 fetch하면 같은 데이터를 두 번 받는다. 데이터·로딩은 `DashboardSection`이 준다.
 *
 * `LoanListCard`와 합치지 않는다: 저쪽은 `status=ON_LOAN` 고정 + 서버 페이지네이션 + 조회를
 * 자기가 소유한다. 여기는 상태 무필터(반납 건이 섞인다) + 페이지네이션 없음 + 데이터 주입이다.
 * 계약이 정반대라 prop으로 이으면 축이 셋 늘고 양쪽 다 읽기 어려워진다.
 *
 * 페이지네이션 prop(`pageSize`/`serverPagination`)을 **둘 다 주지 않는다** — 기획상
 * 최근 10건만 보여주는 요약 표라 푸터가 없어야 한다(`DataTable`은 둘 다 없으면 푸터를 그리지 않는다).
 * 디자인의 "전체 보기" 링크도 기획에서 제외됐다.
 */
export function RecentLoansCard({
  rows,
  loading = false,
  className,
}: RecentLoansCardProps) {
  return (
    <Card title="최근 활동" titleAs="h2" noPadding className={className}>
      <DataTable<LoanActivity>
        caption="최근 활동 목록 (활동 시각 최신순)"
        columns={DASHBOARD_LOAN_COLUMNS}
        rows={rows}
        loading={loading}
        emptyText="아직 활동 기록이 없습니다."
        renderCell={(col, value, row) => {
          if (col.key === "status") {
            const badge = toLoanBadgeStatus(row);
            // 이 표의 헤더는 "상태"가 아니라 "활동"이다 — 행이 대출 건이 아니라
            // 대출/반납 이벤트라서다. 그래서 반납 건만 상태명("반납완료") 대신
            // 행위명("반납")으로 쓴다. **이 카드 전용 오버라이드다** — 대출 내역 등
            // 다른 표의 `returned` 배지는 기본 라벨을 그대로 쓰므로
            // `StatusBadge`의 `STATUS_MAP`이나 `loan-table.ts`를 고치지 말 것.
            return (
              <StatusBadge
                status={badge}
                label={badge === "returned" ? "반납" : undefined}
              />
            );
          }
          if (col.key === "borrowerName" && row.borrowerName === null) {
            // 이 표는 상태 필터가 없어 반납 완료 건이 섞인다. 서버는 반납 시점에
            // 대출자 이름을 파기하므로(개인정보) 값이 null로 내려온다 — 빈 셀 대신
            // 사유를 명시한다. 실패가 아니라 정상 동작이다.
            return <EmptyCell label="반납 완료 — 대출자 정보 파기됨" />;
          }
          if (col.key === "activityAt") {
            // 보조색·줄바꿈 금지는 컬럼 플래그(`secondary`/`nowrap`)가 td에서 이미
            // 적용한다 — 여기서 className으로 다시 칠하지 말 것. 남는 건 원본 시각
            // 노출뿐이라 `title`(툴팁) + `<time dateTime>`(기계 판독)만 붙인다.
            return (
              <time dateTime={row.activityAt} title={row.activityAt}>
                {formatRelativeTime(row.activityAt)}
              </time>
            );
          }
          return value as React.ReactNode;
        }}
      />
    </Card>
  );
}
