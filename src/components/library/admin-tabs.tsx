"use client";

import type * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  ADMIN_TAB_ITEMS,
  resolveActiveNavId,
  type AdminTabItem,
} from "@/components/library/nav-items";

/**
 * 관리자 탭 스타일.
 *
 * 사이드바의 `navItemVariants`와 통합하지 않는다 — 활성 표현의 CSS 속성 자체가
 * 다르다(배경색 vs 아래 보더). `border-b-2`는 base에 두고 비활성은
 * `border-transparent`로 처리한다. 조건부로 보더를 붙이면 활성 전환마다
 * 높이가 1px 흔들린다.
 *
 * `py-3`(12px)은 디자인 11px을 4px 그리드에 맞춰 반올림한 값이다
 * (하드코딩 px 금지 규약, 1회용 토큰 신설도 과함).
 */
const adminTabVariants = cva(
  [
    "-mb-px inline-flex shrink-0 items-center whitespace-nowrap border-b-2 px-4 py-3",
    "text-body tracking-normal leading-none transition-colors duration-100 focus-ring",
  ],
  {
    variants: {
      active: {
        true: "border-primary font-semibold text-primary",
        false: "border-transparent font-normal text-fg-muted hover:text-fg",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export interface AdminTabsProps
  extends Omit<React.ComponentProps<"nav">, "children"> {
  /** 기본 탭 목록 대체 (테스트·스토리용). 실사용은 기본값 그대로 쓴다. */
  items?: AdminTabItem[];
}

/**
 * 관리자 페이지 탭 바. `src/app/admin/layout.tsx`가 유일한 마운트 지점이다.
 *
 * `Sidebar`/`AppSidebar`처럼 프레젠테이션·라우팅 어댑터로 쪼개지 않았다 —
 * 소비처가 하나뿐이라 `usePathname()`을 직접 소유한다. 두 번째 소비처가 생기면
 * 그때 `activeId` prop을 뽑는다.
 *
 * 활성 판정은 사이드바와 **같은** `resolveActiveNavId`를 쓴다 — 경로→id 변환을
 * 두 벌로 만들지 않는다. `role="tablist"`/`role="tab"`을 쓰지 않는 이유는 이것이
 * ARIA 탭 위젯이 아니라 라우트 링크 목록이기 때문이다(tab role은 `aria-controls`·
 * `tabpanel`·화살표 키 로밍·`tabindex` 관리를 전부 요구한다).
 *
 * 좌우 패딩을 주지 않는다 — 페이지 여백은 `src/app/layout.tsx`의 `<main>`이
 * 소유한다. 탭 바 아래 간격(`mb-6`)은 `PageHeader`와 같은 리듬으로 여기가 소유한다.
 */
export function AdminTabs({
  className,
  items = ADMIN_TAB_ITEMS,
  ...props
}: AdminTabsProps) {
  const pathname = usePathname();
  const activeId = resolveActiveNavId(pathname, items);

  return (
    <nav
      aria-label="관리자 메뉴"
      className={cn(
        // overflow-x-auto는 반응형 규칙이 아니라 좁은 뷰포트에서 탭이 줄바꿈돼
        // 밑줄 rail이 깨지는 것을 막는 안전장치다(탭의 shrink-0과 한 쌍).
        "mb-6 flex items-center gap-1 overflow-x-auto border-b border-line",
        className,
      )}
      {...props}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;

        return (
          <Link
            key={item.id}
            href={item.href}
            className={adminTabVariants({ active: isActive })}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
