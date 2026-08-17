"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { ListErrorState } from "@/components/ui/list-error-state";
import { Toast, type ToastTone } from "@/components/ui/toast";
import { StatusBadge } from "@/components/library/status-badge";
import {
  BOOK_ITEM_SEARCH_COLUMNS,
  EMPTY_CELL,
  toBookItemBadgeStatus,
} from "@/components/library/book-table";
import { isApiError } from "@/lib/api/client";
import {
  changeBookItemStatus,
  searchBookItems,
  BOOK_ITEM_NOT_FOUND_CODE,
  type BookItemSearchResult,
  type BookItemSearchRow,
  type ChangeableBookItemStatus,
} from "@/lib/api/bookitems";
import { useDebouncedValue } from "@/lib/use-debounced-value";

export interface CopyListCardProps {
  /** 등록 폼 성공 신호(부모 소유). 값이 바뀌면 1페이지로 되돌린 뒤 재조회한다 */
  refreshToken?: number;
  /** 페이지당 행 수. 기본 10 (API 기본값) */
  pageSize?: number;
  className?: string;
}

type ToastState = { open: boolean; tone: ToastTone; message: string };

const CLOSED_TOAST: ToastState = { open: false, tone: "success", message: "" };

/**
 * 상태 변경 액션 정의. 버튼 라벨과 토스트 문구가 갈라지지 않도록 한 곳에서 소유한다.
 * 배열로 두고 map으로 렌더한다 — 버튼 JSX를 두 벌 쓰면 disabled/aria-busy/variant가 조용히 갈라진다.
 */
const STATUS_ACTIONS: { status: ChangeableBookItemStatus; label: string }[] = [
  { status: "LOST", label: "분실" },
  { status: "DISPOSED", label: "폐기" },
];

/**
 * 토스트 문구용 라벨. `STATUS_ACTIONS`를 `Object.entries(ACTION_LABEL)`로 파생시키면
 * 키 타입이 `string`으로 넓어지므로 두 상수를 그대로 둔다(값 중복 2개는 허용 범위).
 */
const ACTION_LABEL: Record<ChangeableBookItemStatus, string> = {
  LOST: "분실",
  DISPOSED: "폐기",
};

/**
 * 소장본 목록 카드. 검색(관리번호·도서명)·서버 페이지네이션·행별 상태 변경을 한 책임으로 묶는다.
 *
 * 백엔드 `GET /bookitems`는 `q`와 `managementNumber`를 **AND**로 묶으므로 디자인 원본의
 * 통합 검색창 하나로는 OR 검색이 불가능하다 — 입력을 둘로 나눈 이유다.
 *
 * 상태 변경 성공 시 배지를 낙관적으로 바꾸지 않고 재조회한다(`ReturnListCard` 원칙 —
 * 서버가 확정한 상태만 신뢰한다). 재조회 트리거는 둘로 나뉜다: 등록 성공은 부모의
 * `refreshToken`(1페이지 리셋 동반), 상태 변경은 내부 `fetchToken`(현재 페이지 유지).
 *
 * ON_LOAN 차단은 **UI 정책**이다 — 서버는 현재 상태를 검사하지 않고 거부하지도 않는다.
 */
export function CopyListCard({
  refreshToken = 0,
  pageSize = 10,
  className,
}: CopyListCardProps) {
  const [managementNumber, setManagementNumber] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [retry, setRetry] = React.useState(0);
  const [fetchToken, setFetchToken] = React.useState(0);
  const [processingIds, setProcessingIds] = React.useState<Set<number>>(
    () => new Set(),
  );
  const [toast, setToast] = React.useState<ToastState>(CLOSED_TOAST);
  // "요청 키 vs 완료 키" 비교로 loading/error를 파생시킨다(캐스케이딩 렌더 방지 — BookListCard와 동일 패턴).
  const [settled, setSettled] = React.useState<{
    key: string;
    result: BookItemSearchResult | null;
    error: string | null;
  }>({ key: "", result: null, error: null });

  // 디바운스는 **필드마다 한 번씩** 호출한다(use-debounced-value.ts 문서 규칙).
  // 객체로 묶어 넘기면 매 렌더 새 참조가 되어 이펙트가 매번 재실행된다.
  const debouncedManagementNumber = useDebouncedValue(managementNumber).trim();
  const debouncedTitle = useDebouncedValue(title).trim();

  // 검색어 변경과 refreshToken 변경을 하나의 키로 묶어 렌더 중 조정으로 1페이지 리셋한다.
  // (useEffect로 하면 잘못된 페이지가 한 번 그려지는 캐스케이딩 렌더가 된다.)
  // fetchToken은 넣지 않는다 — 이 목록은 status로 필터링하지 않아 상태 변경이 행을
  // 제거하지 않으므로 페이지를 유지해야 한다.
  const pageResetKey = JSON.stringify([
    debouncedManagementNumber,
    debouncedTitle,
    refreshToken,
  ]);
  const [prevPageResetKey, setPrevPageResetKey] = React.useState(pageResetKey);
  if (pageResetKey !== prevPageResetKey) {
    setPrevPageResetKey(pageResetKey);
    setPage(1);
  }

  // 구분자 문자열 대신 JSON 배열로 직렬화한다 — 사용자가 ':'를 입력하면 서로 다른
  // 요청이 같은 키로 뭉개진다(`BookSearchResultCard` 선례).
  const requestKey = JSON.stringify([
    debouncedManagementNumber,
    debouncedTitle,
    page,
    pageSize,
    refreshToken,
    fetchToken,
    retry,
  ]);

  React.useEffect(() => {
    const controller = new AbortController();
    searchBookItems(
      {
        managementNumber: debouncedManagementNumber,
        q: debouncedTitle,
        page,
        pageSize,
      },
      controller.signal,
    )
      .then((data) =>
        setSettled({ key: requestKey, result: data, error: null }),
      )
      .catch((e: unknown) => {
        // 경합/언마운트 취소는 무시한다.
        if (controller.signal.aborted) return;
        setSettled((prev) => ({
          key: requestKey,
          result: prev.result,
          error: isApiError(e) ? e.detail : "목록을 불러오지 못했습니다.",
        }));
      });
    return () => controller.abort();
  }, [debouncedManagementNumber, debouncedTitle, page, pageSize, requestKey]);

  const loading = settled.key !== requestKey;
  const error = loading ? null : settled.error;
  const rows = settled.result?.bookItems ?? [];
  const total = settled.result?.pagination.totalElements ?? 0;

  async function handleChangeStatus(
    row: BookItemSearchRow,
    status: ChangeableBookItemStatus,
  ) {
    setProcessingIds((prev) => new Set(prev).add(row.bookItemId));
    try {
      await changeBookItemStatus(row.bookItemId, { status });
      setToast({
        open: true,
        tone: "success",
        message: `"${row.bookTitle}" ${ACTION_LABEL[status]} 처리되었습니다.`,
      });
      // 낙관적으로 배지를 바꾸지 않는다 — 서버가 확정한 상태만 신뢰한다(ReturnListCard 원칙).
      setFetchToken((t) => t + 1);
    } catch (e) {
      // 다른 창에서 먼저 처리/삭제된 경합 — 목록을 새로고침해 최신 상태로 맞춘다.
      if (isApiError(e) && e.code === BOOK_ITEM_NOT_FOUND_CODE) {
        setFetchToken((t) => t + 1);
      }
      setToast({
        open: true,
        tone: "danger",
        message: isApiError(e)
          ? e.detail
          : "상태 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(row.bookItemId);
        return next;
      });
    }
  }

  return (
    <div className={className}>
      <Card
        title="소장본 목록"
        titleAs="h2"
        noPadding
        titleRight={
          <Badge variant="soft" tone="copy">
            {total.toLocaleString()}건
          </Badge>
        }
      >
        {/* 디자인 원본처럼 목록 카드 헤더 아래 구분선 안에 검색을 둔다 — 별도 Card로 빼지 않는다. */}
        <div className="flex gap-4 border-b border-line px-5 py-3.5">
          <Input
            label="도서명"
            className="flex-1"
            placeholder="도서명으로 검색"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoComplete="off"
          />
          <Input
            label="관리번호"
            className="flex-1"
            placeholder="관리번호로 검색"
            value={managementNumber}
            onChange={(e) => setManagementNumber(e.target.value)}
            autoComplete="off"
          />
        </div>

        {error ? (
          <ListErrorState message={error} onRetry={() => setRetry((n) => n + 1)} />
        ) : (
          <DataTable<BookItemSearchRow>
            caption="소장본 목록"
            columns={BOOK_ITEM_SEARCH_COLUMNS}
            rows={rows}
            loading={loading}
            emptyText="검색 결과가 없습니다."
            renderCell={(col, value, row) => {
              if (col.key === "status") {
                // 매핑을 인라인하지 않는다 — book-table.ts의 사전을 그대로 쓴다.
                return <StatusBadge status={toBookItemBadgeStatus(row.status)} />;
              }

              if (col.key === "bookItemId") {
                // [분기 3] 종결 상태 — 되돌릴 수 없다.
                if (row.status === "LOST" || row.status === "DISPOSED") {
                  return (
                    <span className="text-fg-subtle">
                      <span aria-hidden="true">{EMPTY_CELL}</span>
                      <span className="sr-only">변경할 수 없음</span>
                    </span>
                  );
                }
                // [분기 2] 대출 중 — 서버는 거부하지 않지만 UI 정책으로 호출 자체를 막는다.
                //          disabled 버튼이 아니라 문구다(왜 못 누르는지가 텍스트로 전달된다).
                if (row.status === "ON_LOAN") {
                  return <span className="text-fg-muted">대출 중 변경 불가</span>;
                }
                // [분기 1] AVAILABLE — 분실/폐기
                const processing = processingIds.has(row.bookItemId);
                return (
                  <div className="flex gap-1.5">
                    {STATUS_ACTIONS.map((action) => (
                      <Button
                        key={action.status}
                        variant="ghost"
                        size="sm"
                        disabled={processing}
                        aria-busy={processing}
                        // 행이 여러 개라 "분실"만으로는 스크린리더에서 대상이 구분되지 않는다.
                        aria-label={`${row.managementNumber} ${action.label} 처리`}
                        onClick={() => handleChangeStatus(row, action.status)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                );
              }

              return value as React.ReactNode;
            }}
            serverPagination={{ page, pageSize, total, onPageChange: setPage }}
          />
        )}
      </Card>

      <Toast
        open={toast.open}
        tone={toast.tone}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
