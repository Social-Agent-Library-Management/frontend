"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

export interface DataTableColumn<T> {
  /** 행 객체의 키 */
  key: Extract<keyof T, string>;
  /** 헤더 라벨 */
  label: string;
  /** 컬럼 폭 (예: "30%", "120px"). 데이터 주도 값이라 th의 inline style로 전달한다. */
  width?: string;
  /** 셀 텍스트 줄바꿈 금지 (ID·날짜·코드) */
  nowrap?: boolean;
  /** 셀 텍스트를 보조 색으로 */
  secondary?: boolean;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** 셀 커스텀 렌더러. 반환값이 기본 텍스트를 대체한다. */
  renderCell?: (
    column: DataTableColumn<T>,
    value: T[keyof T],
    row: T,
  ) => React.ReactNode;
  /** rows가 비었을 때 표시할 문구 */
  emptyText?: string;
  /** 행 클릭 핸들러 — 지정하면 행이 키보드로도 조작 가능해진다 */
  onRowClick?: (row: T, index: number) => void;
  /** 페이지당 행 수. 지정하면 클라이언트 페이지네이션 + 푸터가 렌더된다. */
  pageSize?: number;
  /**
   * 서버 페이지네이션(controlled). 지정하면 rows를 슬라이스하지 않고 그대로 렌더하고,
   * 페이지 상태는 호출부가 소유한다. `pageSize`(클라이언트 모드)와 함께 주면 이 prop이 우선한다.
   */
  serverPagination?: {
    /** 1-based 현재 페이지 */
    page: number;
    pageSize: number;
    /** 전체 항목 수 (= pagination.totalElements) */
    total: number;
    onPageChange: (page: number) => void;
  };
  /** 데이터 로딩 중 여부 */
  loading?: boolean;
  /** loading이고 rows가 비었을 때 표시할 문구 */
  loadingText?: string;
  /** 스크린리더용 표 설명 */
  caption?: string;
  className?: string;
}

/** unknown 값을 안전하게 ReactNode로 변환한다(`any` 캐스팅 회피). */
function toNode(value: unknown): React.ReactNode {
  if (value === null || value === undefined || typeof value === "boolean") {
    return null;
  }
  if (typeof value === "string" || typeof value === "number") return value;
  if (React.isValidElement(value)) return value;
  return String(value);
}

/**
 * 도서·대출·소장본 목록용 데이터 테이블.
 *
 * 원본의 `Record<string, any>`를 제네릭 `T`로 바꿔 renderCell 사용처에서
 * 타입 안전성을 유지한다. 행 hover는 `useState` 대신 `hover:` 유틸리티로 처리한다.
 * 페이지네이션은 `ui/pagination.tsx` 프리미티브를 합성한다.
 *
 * 페이지네이션 모드는 둘이다.
 * - `pageSize` — 클라이언트. 전체 rows를 받아 내부에서 슬라이스하고 페이지 상태도 소유한다.
 * - `serverPagination` — 서버. rows가 이미 현재 페이지 분량이므로 슬라이스하지 않는다.
 *   목록 화면에서 `Pagination`을 표 아래에 손으로 붙이지 말고 이 prop을 쓴다.
 */
export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  renderCell,
  emptyText = "데이터가 없습니다.",
  onRowClick,
  pageSize,
  serverPagination,
  loading = false,
  loadingText = "불러오는 중…",
  caption,
  className,
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(1);

  const server = serverPagination;
  const paginated = !server && typeof pageSize === "number" && pageSize > 0;
  const total = rows.length;
  const totalPages =
    paginated && pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  // 행 수나 페이지 크기가 바뀌면 첫 페이지로 되돌린다(원본 useEffect와 동일한 동작).
  // useEffect 대신 렌더 중 조정 패턴을 쓴다 — 이펙트로 하면 잘못된 페이지가 한 번
  // 그려진 뒤 다시 렌더되는 캐스케이딩 렌더가 발생한다.
  // 훅은 조건부 호출이 금지되므로 useState는 그대로 두고 계산만 분기한다.
  const resetKey = server ? "server" : `${total}:${pageSize ?? 0}`;
  const [prevResetKey, setPrevResetKey] = React.useState(resetKey);
  const needsReset = resetKey !== prevResetKey;
  if (needsReset) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  const current = Math.min(needsReset ? 1 : page, totalPages);
  const start = paginated && pageSize ? (current - 1) * pageSize : 0;
  const visibleRows =
    paginated && pageSize ? rows.slice(start, start + pageSize) : rows;

  const clickable = Boolean(onRowClick);
  // 첫 로드(행 0)는 빈 셀에 문구, 페이지 이동(행 있음)은 표를 흐리게 — 스켈레톤을 쓰지 않는다.
  const dimmed = loading && rows.length > 0;

  return (
    <div className={cn("w-full", className)} aria-busy={loading || undefined}>
      <div
        className={cn(
          "w-full overflow-x-auto",
          dimmed && "opacity-60 transition-opacity",
        )}
      >
        <table className="w-full table-auto border-collapse">
          {caption ? <caption className="sr-only">{caption}</caption> : null}

          <thead>
            <tr className="border-y border-line bg-surface-muted">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className="px-4 py-2.5 text-left text-sm font-semibold tracking-normal whitespace-nowrap text-fg-muted"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {total === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-body text-fg-muted"
                >
                  {loading ? loadingText : emptyText}
                </td>
              </tr>
            ) : (
              visibleRows.map((row, i) => {
                const rowIndex = start + i;
                return (
                  <tr
                    key={rowIndex}
                    className={cn(
                      "border-b border-canvas transition-colors duration-100 hover:bg-surface-muted",
                      clickable && "cursor-pointer focus-ring",
                    )}
                    onClick={
                      onRowClick ? () => onRowClick(row, rowIndex) : undefined
                    }
                    // 원본은 클릭 가능한 행이 키보드로 도달 불가였다.
                    tabIndex={clickable ? 0 : undefined}
                    role={clickable ? "button" : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowClick(row, rowIndex);
                            }
                          }
                        : undefined
                    }
                  >
                    {columns.map((col) => {
                      const value = row[col.key];
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            "px-4 py-3.5 align-middle text-md leading-cozy tracking-normal",
                            col.secondary ? "text-fg-muted" : "text-fg",
                            col.nowrap ? "whitespace-nowrap" : "whitespace-normal",
                          )}
                        >
                          {renderCell
                            ? renderCell(col, value, row)
                            : toNode(value)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {server ? (
        server.total > 0 ? (
          <Pagination
            page={server.page}
            pageSize={server.pageSize}
            total={server.total}
            onPageChange={server.onPageChange}
          />
        ) : null
      ) : paginated && pageSize && total > 0 ? (
        <Pagination
          page={current}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
