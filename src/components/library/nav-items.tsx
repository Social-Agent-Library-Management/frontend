import type * as React from "react";

import {
  IconAdmin,
  IconDashboard,
  IconLoan,
  IconReturn,
  IconSearch,
  type IconProps,
} from "@/components/icons";

/**
 * `resolveActiveNavId`가 요구하는 최소 형태 — 사이드바 nav 항목과 관리자 탭이 공유한다.
 * 경로→id 매칭 규칙을 두 벌로 만들지 않기 위한 공통 상위 타입이다.
 */
export interface NavMatchable {
  id: string;
  href?: string;
}

export interface LibraryNavItem extends NavMatchable {
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
 * 관리자 페이지 탭 항목.
 *
 * 아이콘이 없고(디자인상 탭 바는 텍스트 전용) `href`가 필수다 — 사이드바와 달리
 * 버튼 폴백이 없다. 쓰지 않을 `Icon?` 필드를 미리 두지 않는다(필요해지면 그때 추가).
 */
export interface AdminTabItem extends NavMatchable {
  label: string;
  href: string;
}

/**
 * 도서 관리 시스템 최상위 내비게이션.
 *
 * 구성은 일상 조회·운영 화면 4개(대시보드 → 도서 검색 → 대출 등록 → 반납 처리) +
 * 관리자 허브 1개이고, 허브는 항상 마지막이다. `#31`에서 등록·이력 성격의 3개
 * 항목(도서 등록·소장본 등록·대출 내역 조회)을 최상위에서 빼 `ADMIN_TAB_ITEMS`로
 * 옮겼다 — id는 그대로 들고 갔다(이력 추적용).
 *
 * `href`는 앱 라우트의 단일 진실 원천이다(`ADMIN_TAB_ITEMS`와 함께). 새 화면을
 * 추가할 때 여기 항목을 넣고 `src/app/**`에 대응 라우트를 만든다.
 * 명명 규칙: 리소스 복수형 + 액션 세그먼트(등록 폼은 `/new`).
 *
 * "연체 목록"(`#17`) 항목은 `#21`에서 제거했다 — 대출 내역 조회 화면의 상태 필터로
 * 완전히 흡수되는 중복 기능이라 기획에서 뺐다(`/loans/history?status=OVERDUE`와 동등).
 */
export const LIBRARY_NAV_ITEMS: LibraryNavItem[] = [
  { id: "dashboard", label: "대시보드", Icon: IconDashboard, href: "/" },
  {
    id: "book-search",
    label: "도서 검색",
    Icon: IconSearch,
    href: "/books/search",
  },
  {
    id: "loan-register",
    label: "대출 등록",
    Icon: IconLoan,
    href: "/loans/new",
  },
  { id: "return", label: "반납 처리", Icon: IconReturn, href: "/returns" },
  {
    id: "admin",
    label: "관리자 페이지",
    Icon: IconAdmin,
    href: "/admin",
  },
];

/**
 * 관리자 페이지 탭 (`#31`). 디자인 `ADMIN_NAV_ITEMS` 순서를 그대로 따른다.
 *
 * `LIBRARY_NAV_ITEMS`와 같은 파일에 두는 이유는 라우트 href의 단일 진실 원천을
 * 쪼개지 않기 위해서다 — 매칭 규칙(`resolveActiveNavId`)도 여기 있다.
 * 사이드바에서는 `/admin` 항목 하나가 접두 일치로 이 경로들을 모두 대표한다.
 *
 * `/admin/excel-import`·`/admin/data-export`는 위의 명명 규칙(리소스 복수형 +
 * 액션 세그먼트)에서 벗어나지만 기획이 확정한 경로다 — 규칙의 예외로 둔다.
 */
export const ADMIN_TAB_ITEMS: AdminTabItem[] = [
  { id: "book-register", label: "도서 등록", href: "/admin/books/new" },
  { id: "copy-register", label: "소장본 등록", href: "/admin/copies/new" },
  {
    id: "loan-history",
    label: "대출 내역 조회",
    href: "/admin/loans/history",
  },
  { id: "excel-import", label: "엑셀 일괄 등록", href: "/admin/excel-import" },
  { id: "data-export", label: "내보내기", href: "/admin/data-export" },
];

/** `/admin` 진입 시 리다이렉트 대상. 탭 순서가 바뀌면 자동으로 따라간다. */
export const ADMIN_DEFAULT_TAB_HREF = ADMIN_TAB_ITEMS[0].href;

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
 *
 * 사이드바 nav(`LIBRARY_NAV_ITEMS`)와 관리자 탭(`ADMIN_TAB_ITEMS`)이 이 함수를
 * 공유한다 — `NavMatchable`이면 무엇이든 받는다. 접두 일치 덕분에 `/admin/**`
 * 어디에 있어도 사이드바에서는 `"admin"` 하나만 활성이 된다.
 */
export function resolveActiveNavId(
  pathname: string,
  items: readonly NavMatchable[] = LIBRARY_NAV_ITEMS,
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
