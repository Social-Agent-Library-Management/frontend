"use client";

import type * as React from "react";
import Link from "next/link";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { IconBox } from "@/components/ui/icon-box";
import { IconLogo, IconLogout } from "@/components/icons";
import {
  LIBRARY_NAV_ITEMS,
  type LibraryNavItem,
} from "@/components/library/nav-items";

/**
 * nav 항목 스타일.
 *
 * 원본의 `useState(hoveredId)`는 삭제했다 — hover는 CSS가 처리한다.
 * 활성 항목은 hover 규칙 자체를 갖지 않아 상태 스위칭이 필요 없다.
 * 아이콘 색은 `[&_svg]:text-*`가 `currentColor`를 통해 제어한다.
 */
const navItemVariants = cva(
  [
    "mb-0.5 flex h-nav-item w-full items-center gap-3 rounded-button px-4",
    "text-body tracking-normal leading-none transition-colors duration-100 focus-ring",
  ],
  {
    variants: {
      active: {
        true: "bg-primary-light font-semibold text-primary [&_svg]:text-primary",
        false: "font-normal text-fg hover:bg-canvas [&_svg]:text-fg-muted",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export interface SidebarUser {
  name: string;
  email: string;
}

// `onSelect`는 DOM의 select 이벤트 핸들러와 이름이 겹치므로 제외하고 재정의한다.
export interface SidebarProps
  extends Omit<React.ComponentProps<"aside">, "onSelect"> {
  /** 기본 내비게이션 대체 */
  items?: LibraryNavItem[];
  /** 현재 활성 항목 id */
  activeId?: string;
  /** 항목 클릭 핸들러 (`href` 없는 항목에만 적용) */
  onSelect?: (id: string) => void;
  user?: SidebarUser;
  /** 로그아웃 핸들러 — 주어졌을 때만 로그아웃 버튼이 렌더된다 */
  onLogout?: () => void;
}

const DEFAULT_USER: SidebarUser = {
  name: "관리자",
  email: "admin@library.go.kr",
};

/**
 * 260px 고정 좌측 내비게이션. 로고 · 메뉴 · 사용자 푸터로 구성된다.
 * 로고와 아바타 컨테이너는 `ui/icon-box.tsx`를 재사용한다.
 */
export function Sidebar({
  className,
  items = LIBRARY_NAV_ITEMS,
  activeId = "dashboard",
  onSelect,
  user = DEFAULT_USER,
  onLogout,
  ...props
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-sidebar min-w-sidebar shrink-0 flex-col border-r border-line bg-surface",
        className,
      )}
      {...props}
    >
      {/* ── 로고 ─────────────────────────────────── */}
      <div className="flex h-header shrink-0 items-center gap-3 border-b border-line px-5">
        <IconBox
          size="md"
          shape="rounded"
          aria-hidden="true"
          className="rounded-logo bg-primary text-fg-inverse"
        >
          <IconLogo />
        </IconBox>
        <span className="text-lg leading-tight font-bold tracking-tight text-fg">
          도서 관리 시스템
        </span>
      </div>

      {/* ── 메뉴 ─────────────────────────────────── */}
      <nav aria-label="주요 메뉴" className="flex-1 overflow-y-auto p-2">
        {items.map((item) => {
          const isActive = item.id === activeId;
          const itemClass = navItemVariants({ active: isActive });
          const content = (
            <>
              <item.Icon />
              <span>{item.label}</span>
            </>
          );

          return item.href ? (
            <Link
              key={item.id}
              href={item.href}
              className={itemClass}
              aria-current={isActive ? "page" : undefined}
            >
              {content}
            </Link>
          ) : (
            <button
              key={item.id}
              type="button"
              className={itemClass}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onSelect?.(item.id)}
            >
              {content}
            </button>
          );
        })}
      </nav>

      {/* ── 사용자 ───────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-2.5 border-t border-line px-5 py-3.5">
        <IconBox
          size="sm"
          shape="circle"
          aria-hidden="true"
          className="bg-line text-md font-semibold text-fg-muted"
        >
          {user.name.charAt(0)}
        </IconBox>

        <div className="min-w-0 flex-1">
          <p className="text-md leading-snug font-semibold tracking-normal text-fg">
            {user.name}
          </p>
          <p className="truncate text-sm leading-cozy text-fg-muted">
            {user.email}
          </p>
        </div>

        {onLogout ? (
          <button
            type="button"
            aria-label="로그아웃"
            onClick={onLogout}
            className="shrink-0 rounded-sm p-1 text-fg-muted hover:bg-surface-muted focus-ring"
          >
            <IconLogout />
          </button>
        ) : null}
      </div>
    </aside>
  );
}
