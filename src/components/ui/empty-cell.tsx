import { cn } from "@/lib/utils";

export interface EmptyCellProps {
  /**
   * 값이 없는 **사유**. 화면에는 보이지 않고 스크린리더에만 읽힌다
   * (예: "미반납", "파기됨"). em dash만으로는 사유를 전달할 수 없다.
   */
  label: string;
  className?: string;
}

/**
 * 표 셀에 값이 없을 때의 플레이스홀더 — 흐린 em dash + sr-only 사유.
 *
 * `DataTable`의 기본 렌더는 `null`을 빈 셀로 만들어 컬럼이 통째로 비어 보인다.
 * 그 자리에 "없음"을 명시하되, **배지·아이콘을 쓰지 않는다** — pill은 상태 어휘 전용이다.
 *
 * `LoanHistoryCard`의 반납일 셀에 인라인돼 있던 마크업을 대시보드 최근 활동의
 * 대출자 셀(반납 완료 → 이름 파기)이 두 번째 사용처가 되면서 승격한 것이다.
 * **셀마다 다시 마크업하지 말 것** — 색·기호·sr-only 유무가 표마다 갈라진다.
 *
 * `book-table.ts`의 `EMPTY_CELL = "—"`와 합치지 않는다: 저건 셀 **문자열**(포맷 함수의
 * 반환값)이고 이건 사유를 동반한 **노드**다. 문자열이 필요한 자리에 노드를 넣을 수 없다.
 */
export function EmptyCell({ label, className }: EmptyCellProps) {
  return (
    <span className={cn("text-fg-subtle", className)}>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
