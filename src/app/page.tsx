import { PageHeader } from "@/components/ui/page-header";
import { DashboardSection } from "@/components/library/dashboard-section";

/**
 * 루트 세그먼트라 `metadata`를 두지 않는다.
 * layout의 `title.template`은 자식 세그먼트에만 적용되므로, 여기에 title을 두면
 * 접미사 없이 "대시보드"만 출력돼 일관성이 깨진다. layout의 default를 그대로 쓴다.
 *
 * 페이지는 조립만 한다 — 조회·로딩·에러는 전부 `DashboardSection`이 소유한다.
 * 좌우/상하 여백은 `app/layout.tsx`의 `<main>`이 소유하므로 여기서 다시 주지 않는다.
 */
export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="대시보드"
        description="도서 관리 현황을 한눈에 확인하세요"
      />
      <DashboardSection />
    </>
  );
}
