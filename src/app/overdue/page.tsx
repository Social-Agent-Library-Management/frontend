import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = { title: "연체 목록" };

export default function OverduePage() {
  return <PagePlaceholder title="연체 목록" />;
}
