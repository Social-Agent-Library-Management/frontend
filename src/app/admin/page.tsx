import { redirect } from "next/navigation";

import { ADMIN_DEFAULT_TAB_HREF } from "@/components/library/nav-items";

/**
 * `/admin`은 화면이 아니라 허브다 — 항상 첫 탭으로 보낸다.
 *
 * 대상은 `ADMIN_DEFAULT_TAB_HREF`(= `ADMIN_TAB_ITEMS[0].href`)라 탭 순서가 바뀌면
 * 리다이렉트도 따라간다. `next.config.ts`의 `redirects()`를 쓰지 않는 이유는
 * 라우트 지식을 `nav-items.tsx` 한 곳에 모아 두기 위해서다.
 * `redirect()`는 내부적으로 throw하므로 반환문도, try/catch도 두지 않는다.
 */
export default function AdminPage() {
  redirect(ADMIN_DEFAULT_TAB_HREF);
}
