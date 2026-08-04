import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind 클래스를 조건부로 조합하고 충돌을 병합한다.
 * 재사용 컴포넌트에서 variant(cva) 결과와 호출부의 className을 합칠 때 사용한다.
 *
 * @example cn("px-2 py-1", isActive && "bg-primary", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
