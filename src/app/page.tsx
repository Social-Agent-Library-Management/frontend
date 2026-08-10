import { PagePlaceholder } from "@/components/ui/page-placeholder";

/**
 * 루트 세그먼트라 `metadata`를 두지 않는다.
 * layout의 `title.template`은 자식 세그먼트에만 적용되므로, 여기에 title을 두면
 * 접미사 없이 "대시보드"만 출력돼 일관성이 깨진다. layout의 default를 그대로 쓴다.
 */
export default function DashboardPage() {
  return <PagePlaceholder title="대시보드" />;
}
