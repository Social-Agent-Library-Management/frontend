"use client";

import * as React from "react";

import { ListErrorState } from "@/components/ui/list-error-state";
import { StatCard } from "@/components/library/stat-card";
import { RecentLoansCard } from "@/components/library/recent-loans-card";
import { OverdueListCard } from "@/components/library/overdue-list-card";
import {
  IconAlertCircle,
  IconBook,
  IconCopy,
  IconLoan,
} from "@/components/icons";
import { isApiError } from "@/lib/api/client";
import {
  getDashboardSummary,
  type DashboardSummary,
} from "@/lib/api/dashboard";

/** 로딩 중 KPI 자리에 넣는 값. `—`는 "아직 모름"이고 `0`은 "없음"이라 뜻이 다르다. */
const PENDING_VALUE = "—";

function formatCount(value: number | undefined): string {
  return value === undefined ? PENDING_VALUE : value.toLocaleString();
}

/**
 * 대시보드 본문 (`#37`). 화면의 **유일한 클라이언트 경계**다.
 *
 * `/dashboard/summary` 호출 1회를 소유하고 KPI 4장 + 두 패널에 데이터를 내린다.
 * **페이지에서 카드들을 직접 배치하지 말 것** — 배선을 손으로 하면 카드마다 조회가
 * 생기거나 로딩·에러 처리가 갈라진다(`BookSearchSection`·`LoanRegisterSection` 선례).
 *
 * 로딩/에러가 카드 단위가 아니라 **화면 단위**인 이유: 데이터 출처가 요청 하나라
 * 실패도 하나다. 카드마다 `ListErrorState`를 두면 같은 에러 문구가 두 번 뜬다.
 *
 * KPI 그리드는 여기 인라인한다 — 사용처가 1곳뿐이라 `StatCard` 4장을 감싸는 grid 한 줄을
 * 별도 컴포넌트로 뽑으면 과잉 추상화다("2회 반복이면 추출").
 */
export function DashboardSection() {
  const [retry, setRetry] = React.useState(0);
  // `LoanListCard`와 같은 "요청 키 vs 완료 키" 패턴 — 이펙트 첫 줄에서 setState 하는
  // 캐스케이딩 렌더(react-hooks/set-state-in-effect)를 피한다.
  const [settled, setSettled] = React.useState<{
    key: number;
    result: DashboardSummary | null;
    error: string | null;
  }>({ key: -1, result: null, error: null });

  React.useEffect(() => {
    const controller = new AbortController();
    getDashboardSummary(controller.signal)
      .then((data) => setSettled({ key: retry, result: data, error: null }))
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setSettled((prev) => ({
          key: retry,
          result: prev.result,
          error: isApiError(e)
            ? e.detail
            : "대시보드를 불러오지 못했습니다.",
        }));
      });
    return () => controller.abort();
  }, [retry]);

  const loading = settled.key !== retry;
  const error = loading ? null : settled.error;
  const summary = settled.result;

  if (error) {
    return (
      <ListErrorState
        message={error}
        onRetry={() => setRetry((n) => n + 1)}
        className="rounded-card bg-surface"
      />
    );
  }

  return (
    <>
      {/* 원본의 auto-fit minmax(220px,1fr). 4장이 한 줄에 들어가지 않으면 자동 줄바꿈된다. */}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
        <StatCard
          label="전체 도서"
          value={formatCount(summary?.bookCount)}
          sub="등록된 서지 정보"
          tone="primary"
          icon={<IconBook />}
        />
        <StatCard
          label="전체 소장본"
          value={formatCount(summary?.bookItemCount)}
          sub={
            summary
              ? `대출 가능 ${summary.availableBookItemCount.toLocaleString()}권`
              : "대출 가능 —"
          }
          tone="copy"
          subTone="success"
          icon={<IconCopy />}
        />
        <StatCard
          label="현재 대출"
          value={formatCount(summary?.activeLoanCount)}
          sub="활성 대출 건수"
          tone="success"
          icon={<IconLoan />}
        />
        <StatCard
          label="연체 항목"
          value={formatCount(summary?.overdueLoanCount)}
          sub="즉시 확인 필요"
          tone="danger"
          subTone="danger"
          icon={<IconAlertCircle size={24} />}
        />
      </div>

      {/*
        원본은 flex-wrap + flex:'2 1 480px' / '1 1 360px'로 2:1을 만들었다.
        grid 3열 + col-span-2가 같은 비율을 임의값 없이 표현하고, **grid의 기본
        stretch 덕에 두 카드 높이가 자동으로 같아진다** — 연체 6건(`OVERDUE_LIMIT`)은
        좌측 10행 표에 맞춰 계산한 값이지만,
        폰트 렌더 차이로 몇 px 어긋나도 여기서 시각적으로 흡수된다.
      */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <RecentLoansCard
          rows={summary?.recentLoans ?? []}
          loading={loading}
          className="lg:col-span-2"
        />
        <OverdueListCard
          rows={summary?.overdueLoans ?? []}
          totalCount={summary?.overdueLoanCount ?? 0}
          loading={loading}
        />
      </div>
    </>
  );
}
