"use client";

import { Card } from "@/components/ui/card";
import { CheckCard } from "@/components/ui/check-card";
import { EXPORT_SHEET_OPTIONS } from "@/components/library/export-options";
import type { ExportSheet } from "@/lib/api/excel";

export interface ExportSheetSelectCardProps {
  selected: ReadonlySet<ExportSheet>;
  onToggle: (sheet: ExportSheet) => void;
  className?: string;
}

/**
 * 내보낼 시트 선택 카드.
 *
 * 컬럼 미리보기는 **백엔드가 실제로 쓰는 컬럼**이다(`export-options.ts`) — 디자인 목업의
 * 컬럼을 되살리지 말 것. 시트별 행 수(디자인의 4399/4838/2841)는 카운트 API가 없어 표시하지 않는다.
 */
export function ExportSheetSelectCard({
  selected,
  onToggle,
  className,
}: ExportSheetSelectCardProps) {
  return (
    <Card title="포함할 시트" className={className}>
      <div className="flex flex-col gap-2.5">
        {EXPORT_SHEET_OPTIONS.map((sheet) => (
          <CheckCard
            key={sheet.id}
            label={sheet.name}
            description={sheet.columns.join(" · ")}
            checked={selected.has(sheet.id)}
            onChange={() => onToggle(sheet.id)}
          />
        ))}
      </div>
    </Card>
  );
}
