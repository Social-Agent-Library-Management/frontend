/**
 * 한국어 조사 선택(파생 로직). UI에서 분리한다 — `lib/dday.ts`와 같은 계열이다.
 *
 * 한글 음절은 U+AC00부터 (초성 × 21 × 28 + 중성 × 28 + 종성) 순으로 배열되므로
 * 종성 인덱스 = (코드 - 0xAC00) % 28 이고, 0이면 받침이 없다.
 *
 * **조사 분기를 컴포넌트에 인라인하지 말 것** — 받침 판정 규칙이 화면마다 갈라진다.
 */

/** 한글 음절 영역(가 ~ 힣). 이 범위 밖이면 모듈로 산술이 의미를 잃는다. */
const HANGUL_SYLLABLE_START = 0xac00;
const HANGUL_SYLLABLE_END = 0xd7a3;

/**
 * 숫자로 끝나는 말은 **읽는 소리**로 받침을 판정한다(영·일·삼·육·칠·팔에 받침이 있다).
 * 도서명에 숫자가 흔해서("해리포터7") 이 분기가 없으면 "7를" 같은 오출력이 난다.
 */
const DIGITS_WITH_BATCHIM = new Set(["0", "1", "3", "6", "7", "8"]);

/** 종성 인덱스 8 = ㄹ(한글 음절 U+AC00 배열 순서상). */
const HANGUL_RIEUL_FINAL_INDEX = 8;

/** 읽는 소리가 ㄹ받침으로 끝나는 숫자(일·칠·팔) — `으로/로` 예외 판정에 쓴다. */
const DIGITS_WITH_RIEUL_BATCHIM = new Set(["1", "7", "8"]);

/**
 * 마지막 글자가 한글 음절이면 종성 인덱스(0~27, 0=받침 없음)를, 아니면 `null`을 반환한다.
 * `hasBatchim`/`hasRieulBatchim`이 공유하는 "마지막 글자 판별" 로직을 여기 한 곳에 둔다.
 *
 * ⚠️ 서로게이트 페어: `word[word.length - 1]`은 이모지 등에서 하위 서로게이트를 집는다.
 *    그 코드포인트는 한글 음절 범위 밖이라 `null` 폴백으로 안전하게 떨어지므로
 *    코드포인트 단위 순회를 추가하지 않는다(의도된 단순화).
 */
function jongseongIndex(word: string): number | null {
  if (word.length === 0) return null;

  const code = word.charCodeAt(word.length - 1);
  if (code < HANGUL_SYLLABLE_START || code > HANGUL_SYLLABLE_END) return null;

  return (code - HANGUL_SYLLABLE_START) % 28;
}

/**
 * 마지막 글자에 받침이 있으면 true.
 *
 * - 빈 문자열 → `false`. 렌더 경로에서는 truthy 가드로 도달 불가지만 함수 자체는 전역(total)이어야 한다.
 * - 한글 음절 → 종성 인덱스로 판정.
 * - 숫자 → 위 `DIGITS_WITH_BATCHIM` 기준.
 * - 그 외(라틴 문자 등, `"Clean Code"`) → **받침 없음**으로 취급한다(외래어 관용).
 *   글자 이름별 정확 판정(L·M·N·R…)은 이번 범위 밖 — 필요해지면 그때 확장한다.
 */
export function hasBatchim(word: string): boolean {
  const jongseong = jongseongIndex(word);
  if (jongseong !== null) return jongseong !== 0;

  return DIGITS_WITH_BATCHIM.has(word[word.length - 1]);
}

/** 보조사(주제): 받침 있으면 `은`, 없으면 `는`을 붙인 문자열을 반환한다. */
export function withEun(word: string): string {
  return `${word}${hasBatchim(word) ? "은" : "는"}`;
}

/**
 * 마지막 글자 받침이 **ㄹ**이면 true.
 *
 * `으로/로` 조사는 받침이 없거나 ㄹ받침이면 `로`, 그 외 받침이면 `으로`를 쓴다
 * (예: "서울로"·"연필로" — ㄹ받침은 모음 받침처럼 취급). `을/를`·`은/는` 등
 * 다른 조사에는 이 예외가 없으므로 `hasBatchim`과 분리한 별도 함수로 둔다.
 */
function hasRieulBatchim(word: string): boolean {
  const jongseong = jongseongIndex(word);
  if (jongseong !== null) return jongseong === HANGUL_RIEUL_FINAL_INDEX;

  return DIGITS_WITH_RIEUL_BATCHIM.has(word[word.length - 1]);
}

/** 부사격 조사: 받침이 없거나 ㄹ받침이면 `로`, 그 외 받침이 있으면 `으로`를 붙인 문자열을 반환한다. */
export function withEuro(word: string): string {
  return `${word}${!hasBatchim(word) || hasRieulBatchim(word) ? "로" : "으로"}`;
}
