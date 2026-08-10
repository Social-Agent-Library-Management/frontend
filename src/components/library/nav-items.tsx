import type * as React from "react";

import {
  IconBook,
  IconCopy,
  IconDashboard,
  IconHistory,
  IconLoan,
  IconOverdue,
  IconReturn,
  type IconProps,
} from "@/components/icons";

export interface LibraryNavItem {
  id: string;
  label: string;
  /** 아이콘 컴포넌트. `color` prop 없이 `currentColor`를 쓴다. */
  Icon: React.ComponentType<IconProps>;
  /**
   * 라우트 경로. 있으면 Sidebar가 `<Link>`로, 없으면 `<button>`으로 렌더한다.
   * 화면 이슈에서 라우트가 생기면 Sidebar 재작성 없이 여기만 채우면 된다.
   */
  href?: string;
}

/** 도서 관리 시스템 기본 내비게이션 7종 (원본 SIDEBAR_NAV_ITEMS 순서·라벨 유지) */
export const LIBRARY_NAV_ITEMS: LibraryNavItem[] = [
  { id: "dashboard", label: "대시보드", Icon: IconDashboard },
  { id: "book-register", label: "도서 등록", Icon: IconBook },
  { id: "copy-register", label: "소장본 등록", Icon: IconCopy },
  { id: "loan-register", label: "대출 등록", Icon: IconLoan },
  { id: "return", label: "반납 처리", Icon: IconReturn },
  { id: "loan-history", label: "대출 내역 조회", Icon: IconHistory },
  { id: "overdue", label: "연체 목록", Icon: IconOverdue },
];
