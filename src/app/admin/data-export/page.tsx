import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = { title: "내보내기" };

/**
 * 아직 구현 전인 탭이라 `PagePlaceholder`만 조립한다 — 이 화면 전용 빈 상태
 * 컴포넌트를 새로 만들지 말 것. 상단 탭 바는 `src/app/admin/layout.tsx`가 그린다.
 */
export default function DataExportPage() {
  return (
    <PagePlaceholder
      title="내보내기"
      description="대출·도서 데이터를 엑셀 파일로 내보내는 기능은 준비 중입니다."
    />
  );
}
