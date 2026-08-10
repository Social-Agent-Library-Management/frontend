"use client";

import { usePathname } from "next/navigation";

import { Sidebar, type SidebarProps } from "@/components/library/sidebar";
import {
  LIBRARY_NAV_ITEMS,
  resolveActiveNavId,
} from "@/components/library/nav-items";

export type AppSidebarProps = Omit<SidebarProps, "activeId" | "onSelect">;

/**
 * 라우팅에 연결된 `Sidebar`. 앱 셸의 유일한 클라이언트 경계다.
 *
 * `Sidebar`는 `activeId`를 prop으로 받는 순수 프레젠테이션 컴포넌트로 두고,
 * pathname → activeId 변환만 이 어댑터가 담당한다.
 * 레이아웃에서는 `Sidebar`를 직접 쓰지 말고 이 컴포넌트를 쓴다.
 */
export function AppSidebar({
  items = LIBRARY_NAV_ITEMS,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();

  // 미매칭 경로(404 등)에서 아무 항목도 활성화하지 않는다.
  // Sidebar의 activeId 기본값이 "dashboard"이므로 undefined를 넘기면 안 된다.
  const activeId = resolveActiveNavId(pathname, items) ?? "";

  return <Sidebar items={items} activeId={activeId} {...props} />;
}
