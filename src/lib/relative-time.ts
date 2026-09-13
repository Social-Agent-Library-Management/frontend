/**
 * 상대 시간("N분 전") 표시 로직. 대시보드 "최근 활동" 표의 활동 시각 셀이 쓴다.
 * `dday.ts`와 같은 자리·같은 이유다 — 표시 파생 로직은 컴포넌트 밖 순수 함수로 둔다.
 */

/**
 * ISO-8601 시각을 "얼마나 지났는지"로 포맷한다.
 * `1분 미만`→"방금 전" / `1시간 미만`→"N분 전" / `24시간 미만`→"N시간 전" /
 * `1일`→"어제" / `7일 미만`→"N일 전" / `28일 미만`→"N주 전" / 그 이상→`YYYY-MM-DD`.
 *
 * `now`는 **테스트에서 시각을 고정하기 위한 인자**다. 호출부는 넘기지 않는다 —
 * 렌더 시점에 한 번 계산하면 충분하고, `setInterval`로 주기 갱신하지 않는다
 * (페이지 진입 시 1회 조회하는 요약 뷰이고, 같은 화면의 KPI도 실시간 갱신하지 않는다).
 *
 * 세부 규칙 셋:
 * - `Math.max(0, …)` — 서버·클라이언트 시계 차로 미래 시각이 오면 "-1분 전"이 나온다. 0으로 깎아 "방금 전"으로 떨어뜨린다.
 * - 28일 이상은 `at.slice(0, 10)`으로 앞 10자를 그대로 쓴다. `toISOString()`으로 다시 만들면 UTC로 변환돼 하루가 밀린다.
 * - 파싱 불가한 값이 오면 `mins`가 NaN이라 모든 비교가 false가 되어 마지막 날짜 표기로 떨어진다 — 별도 가드를 두지 않는다.
 *
 * 날짜만 있는 값(`"YYYY-MM-DD"`)에 시각을 보정하는 분기는 **두지 않는다**. 디자인 원본에
 * 있던 그 분기는 목업 더미 데이터 때문이고, 실제 API는 항상 완전한 `LocalDateTime`을 내려준다.
 */
export function formatRelativeTime(at: string, now: Date = new Date()): string {
  const mins = Math.max(
    0,
    Math.round((now.getTime() - new Date(at).getTime()) / 60000),
  );
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;

  const days = Math.floor(hrs / 24);
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 28) return `${Math.floor(days / 7)}주 전`;

  return at.slice(0, 10);
}
