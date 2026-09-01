import type * as React from "react";

import { AdminTabs } from "@/components/library/admin-tabs";

/**
 * 관리자 페이지 셸. 탭 바는 하위 라우트를 오갈 때도 유지된다(중첩 레이아웃).
 *
 * 래퍼 `<div>`를 두지 않는다 — 컨테이너는 `src/app/layout.tsx`의 `<main>`이다.
 * 좌우/상하 여백도 그쪽이 소유하므로 여기서 px/py를 주지 않고, 탭 바 아래 간격은
 * `AdminTabs`가 `mb-6`으로 소유한다. `metadata`는 각 탭 페이지가 소유한다.
 */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AdminTabs />
      {children}
    </>
  );
}
