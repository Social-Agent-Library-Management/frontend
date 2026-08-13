import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { OverdueListCard } from "@/components/library/overdue-list-card";

export const metadata: Metadata = { title: "연체 목록" };

export default function OverduePage() {
  return (
    <>
      <PageHeader
        title="연체 목록"
        description="반납 예정일 익일부터 연체로 집계"
      />
      <OverdueListCard />
    </>
  );
}
