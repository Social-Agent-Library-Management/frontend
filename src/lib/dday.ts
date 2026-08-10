/**
 * 반납 기한(D-day) 파생 로직.
 * DdayCard 외에 연체 목록 화면에서도 같은 계산을 쓰므로 UI에서 분리했다.
 */

export type Urgency = "urgent" | "warning" | "normal";

/**
 * 남은 일수로 긴급도를 판정한다.
 * - `<= 2`  : urgent  (연체 포함 — 음수도 여기에 들어온다)
 * - `<= 5`  : warning
 * - 그 외   : normal
 *
 * 원본의 `if (daysLeft <= 0) return 'urgent';`는 바로 다음 `daysLeft <= 2` 분기에
 * 완전히 포함되는 죽은 코드라 제거했다(동작 동일).
 */
export function getUrgency(daysLeft: number): Urgency {
  if (daysLeft <= 2) return "urgent";
  if (daysLeft <= 5) return "warning";
  return "normal";
}

/**
 * 남은 일수를 D-day 라벨로 포맷한다.
 * - 음수 → `D+N` (연체)
 * - 0    → `D-Day`
 * - 양수 → `D-N`
 */
export function formatDday(daysLeft: number): string {
  if (daysLeft < 0) return `D+${Math.abs(daysLeft)}`;
  if (daysLeft === 0) return "D-Day";
  return `D-${daysLeft}`;
}
