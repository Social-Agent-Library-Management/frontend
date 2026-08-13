"use client";

import * as React from "react";

/** 기본 지연 시간. `BookSelectField`가 쓰던 값을 그대로 승계한다. */
const DEFAULT_DELAY_MS = 250;

/**
 * 값 변경을 `delay`ms 지연시켜 돌려준다 — 타이핑마다 서버 요청을 보내지 않기 위한 훅.
 *
 * `BookSelectField`(`#9`)에 인라인돼 있던 디바운스를 `LoanHistoryCard`(`#15`)가
 * 두 번째로 필요로 하면서 승격했다. **컴포넌트에 디바운스를 다시 인라인하지 말 것** —
 * 두 벌을 남기면 화면마다 지연 시간이 조용히 갈라진다.
 *
 * 객체·배열을 그대로 넘기지 않는다. 매 렌더 새 참조가 생겨 이펙트가 매번 재실행되므로,
 * 필드가 여러 개면 **필드마다 한 번씩** 호출한다.
 */
export function useDebouncedValue<T>(value: T, delay = DEFAULT_DELAY_MS): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
