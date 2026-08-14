import type * as React from "react";

import {
  IconBook,
  IconCopy,
  IconDashboard,
  IconHistory,
  IconLoan,
  IconReturn,
  IconSearch,
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

/**
 * 도서 관리 시스템 내비게이션 (원본 SIDEBAR_NAV_ITEMS 순서·라벨 유지 + 이후 추가분).
 *
 * 순서는 도메인 그룹(도서 → 소장본 → 대출 → 반납 → 이력)을 따르고, 그룹 안에서는
 * 등록 → 조회 순이다 — "도서 검색"(`#23`)이 "도서 등록" 다음에 오는 이유다.
 *
 * `href`는 앱 라우트의 단일 진실 원천이다. 새 화면을 추가할 때
 * 여기 항목을 넣고 `src/app/**`에 대응 라우트를 만든다.
 * 명명 규칙: 리소스 복수형 + 액션 세그먼트(등록 폼은 `/new`).
 *
 * "연체 목록"(`#17`) 항목은 `#21`에서 제거했다 — 대출 내역 조회 화면의 상태 필터로
 * 완전히 흡수되는 중복 기능이라 기획에서 뺐다(`/loans/history?status=OVERDUE`와 동등).
 */
export const LIBRARY_NAV_ITEMS: LibraryNavItem[] = [
  { id: "dashboard", label: "대시보드", Icon: IconDashboard, href: "/" },
  {
    id: "book-register",
    label: "도서 등록",
    Icon: IconBook,
    href: "/books/new",
  },
  {
    id: "book-search",
    label: "도서 검색",
    Icon: IconSearch,
    href: "/books/search",
  },
  {
    id: "copy-register",
    label: "소장본 등록",
    Icon: IconCopy,
    href: "/copies/new",
  },
  {
    id: "loan-register",
    label: "대출 등록",
    Icon: IconLoan,
    href: "/loans/new",
  },
  { id: "return", label: "반납 처리", Icon: IconReturn, href: "/returns" },
  {
    id: "loan-history",
    label: "대출 내역 조회",
    Icon: IconHistory,
    href: "/loans/history",
  },
];

/** 끝의 `/`를 제거한다. 빈 문자열이 되면 루트(`"/"`)로 되돌린다. */
function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/**
 * 현재 pathname에 해당하는 nav 항목 id를 찾는다.
 *
 * 라우터에 의존하지 않는 순수 함수 — 서버·클라이언트·테스트 어디서든 호출 가능하다.
 * 매칭 규칙과 href 값은 함께 바뀌므로 같은 파일에 둔다.
 *
 * 규칙: ① 정확 일치 우선 ② 없으면 최장 접두 일치(`href + "/"`)
 * ③ `"/"`는 모든 경로의 접두사이므로 접두 일치에서 제외한다.
 * 결과적으로 활성 항목은 항상 0개 또는 1개다.
 */
export function resolveActiveNavId(
  pathname: string,
  items: LibraryNavItem[] = LIBRARY_NAV_ITEMS,
): string | undefined {
  const current = normalizePathname(pathname);

  let prefixMatchId: string | undefined;
  let prefixMatchLength = 0;

  for (const item of items) {
    const { href } = item;
    if (!href) continue;

    const target = normalizePathname(href);

    if (current === target) return item.id;

    // 루트는 모든 경로에 접두 일치하므로 정확 일치로만 잡는다.
    if (target === "/") continue;

    // 중첩 라우트(`/books/new/step-2`)에서도 부모 메뉴가 활성이 되도록,
    // 접두 일치 중 가장 긴 href를 고른다.
    if (current.startsWith(`${target}/`) && target.length > prefixMatchLength) {
      prefixMatchId = item.id;
      prefixMatchLength = target.length;
    }
  }

  return prefixMatchId;
}
