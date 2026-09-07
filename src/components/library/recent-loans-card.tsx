import type * as React from "react";

import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyCell } from "@/components/ui/empty-cell";
import { StatusBadge } from "@/components/library/status-badge";
import {
  DASHBOARD_LOAN_COLUMNS,
  toLoanBadgeStatus,
} from "@/components/library/loan-table";
import type { LoanSummary } from "@/lib/api/loans";

export interface RecentLoansCardProps {
  /** 이미 조회된 행. 서버가 대여일 내림차순으로 잘라 내려준 그대로 렌더한다. */
  rows: LoanSummary[];
  loading?: boolean;
  className?: string;
}

/**
 * 대시보드 "최근 대출 활동" 카드 (`#37`).
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
    <Card title="최근 대출 활동" titleAs="h2" noPadding className={className}>
      <DataTable<LoanSummary>
        caption="최근 대출 활동 목록 (대여일 최신순)"
        columns={DASHBOARD_LOAN_COLUMNS}
        rows={rows}
        loading={loading}
        emptyText="아직 대출 기록이 없습니다."
        renderCell={(col, value, row) => {
          if (col.key === "status") {
            return <StatusBadge status={toLoanBadgeStatus(row)} />;
          }
          if (col.key === "borrowerName" && row.borrowerName === null) {
            // 이 표는 상태 필터가 없어 반납 완료 건이 섞인다. 서버는 반납 시점에
            // 대출자 이름을 파기하므로(개인정보) 값이 null로 내려온다 — 빈 셀 대신
            // 사유를 명시한다. 실패가 아니라 정상 동작이다.
            return <EmptyCell label="반납 완료 — 대출자 정보 파기됨" />;
          }
          return value as React.ReactNode;
        }}
      />
    </Card>
  );
}
