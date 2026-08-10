"use client";

import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** 생략 기호. 페이지 번호 배열에서 숫자와 구분하는 리터럴이다. */
export const PAGE_GAP = "…" as const;

/**
 * 표시할 페이지 번호 목록을 만든다.
 * 총 7페이지 이하면 전부, 그 이상이면 `1 … current-1 current current+1 … last`.
 */
export function getPageNumbers(
  current: number,
  totalPages: number,
): Array<number | typeof PAGE_GAP> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const out: Array<number | typeof PAGE_GAP> = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(totalPages - 1, current + 1);

  if (from > 2) out.push(PAGE_GAP);
  for (let p = from; p <= to; p += 1) out.push(p);
  if (to < totalPages - 1) out.push(PAGE_GAP);
  out.push(totalPages);

  return out;
}

/**
 * 페이지 버튼.
 *
 * Button 프리미티브에 흡수하지 않았다 — radius(4 vs 8), padding, font-weight,
 * disabled 톤(opacity .5/default vs .42/not-allowed), active 상태까지 5개 축이
 * 충돌해 오직 이 소비자를 위한 억지 일반화가 되기 때문이다.
 */
const pageButtonVariants = cva(
  [
    "inline-flex h-7.5 min-w-7.5 items-center justify-center rounded-sm border",
    "px-2.25 text-sm tracking-normal leading-none transition-colors focus-ring",
    "disabled:cursor-default disabled:opacity-50",
  ],
  {
    variants: {
      state: {
        default:
          "border-line bg-surface text-fg font-normal not-disabled:hover:bg-surface-muted disabled:text-fg-subtle",
        active: "border-primary bg-primary text-fg-inverse font-semibold",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

type PageButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof pageButtonVariants>;

function PageButton({ className, state, ...props }: PageButtonProps) {
  return (
    <button
      type="button"
      className={cn(pageButtonVariants({ state }), className)}
      {...props}
    />
  );
}

export interface PaginationProps
  extends Omit<React.ComponentProps<"div">, "onChange"> {
  /** 현재 페이지 (1-based, controlled) */
  page: number;
  /** 페이지당 항목 수 */
  pageSize: number;
  /** 전체 항목 수 */
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  className,
  page,
  pageSize,
  total,
  onPageChange,
  ...props
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * pageSize;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-t border-line px-4 py-3",
        className,
      )}
      {...props}
    >
      <div className="text-sm whitespace-nowrap text-fg-muted">
        총 {total.toLocaleString()}건 중 {(start + 1).toLocaleString()}–
        {Math.min(start + pageSize, total).toLocaleString()}
      </div>

      {totalPages > 1 ? (
        <nav aria-label="페이지네이션" className="flex items-center gap-1">
          <PageButton
            disabled={current === 1}
            onClick={() => onPageChange(current - 1)}
          >
            이전
          </PageButton>

          {getPageNumbers(current, totalPages).map((p, i) =>
            p === PAGE_GAP ? (
              <span
                key={`gap-${i}`}
                aria-hidden="true"
                className="px-1 text-sm text-fg-subtle"
              >
                {PAGE_GAP}
              </span>
            ) : (
              <PageButton
                key={p}
                state={p === current ? "active" : "default"}
                aria-current={p === current ? "page" : undefined}
                aria-label={`${p}페이지`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </PageButton>
            ),
          )}

          <PageButton
            disabled={current === totalPages}
            onClick={() => onPageChange(current + 1)}
          >
            다음
          </PageButton>
        </nav>
      ) : null}
    </div>
  );
}
