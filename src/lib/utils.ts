import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge는 Tailwind **기본** 스케일만 알고 있어서, `@theme`에 새로 정의한
 * 키(`rounded-logo`, `text-body`, `leading-cozy` …)는 같은 그룹으로 인식하지 못한다.
 * 등록하지 않으면 `cn("rounded-dday", "rounded-logo")`가 두 클래스를 모두 남기고,
 * 승패가 클래스 순서가 아니라 생성된 CSS의 정렬 순서로 결정되는 조용한 버그가 된다.
 *
 * → globals.css의 `@theme`에 커스텀 키를 추가하면 여기도 함께 갱신한다.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [
        { rounded: ["button", "input", "card", "badge", "logo", "dday", "modal"] },
      ],
      "font-size": [{ text: ["2xs", "md", "body"] }],
      leading: [{ leading: ["cozy"] }],
      shadow: [{ shadow: ["focus-ring", "dropdown"] }],
      w: [{ w: ["sidebar"] }],
      "min-w": [{ "min-w": ["sidebar"] }],
      h: [{ h: ["header", "nav-item"] }],
      px: [{ px: ["input-x", "page-x"] }],
      py: [{ py: ["page-y"] }],
    },
  },
});

/**
 * Tailwind 클래스를 조건부로 조합하고 충돌을 병합한다.
 * 재사용 컴포넌트에서 variant(cva) 결과와 호출부의 className을 합칠 때 사용한다.
 *
 * @example cn("px-2 py-1", isActive && "bg-primary", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
