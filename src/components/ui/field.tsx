"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * 폼 필드의 껍데기(라벨 · 필수표시 · hint/error · aria-describedby 배선).
 *
 * `Input`과 `Combobox`가 이걸 공유한다 — 두 필드의 에러 표기가 갈라지지 않게
 * id 파생 규칙과 렌더 구조를 한 곳에 둔다. 컨트롤 본체(input/listbox)는 children이다.
 * variant가 없다: 분기가 "hint냐 error냐" 하나뿐이라 cva를 쓰면 오히려 산만해진다.
 */

/** id 파생 규칙의 단일 진실 원천 — Field와 useFieldIds가 공유한다 */
export function hintIdOf(controlId: string): string {
  return `${controlId}-hint`;
}

export function errorIdOf(controlId: string): string {
  return `${controlId}-error`;
}

export interface FieldIds {
  controlId: string;
  hintId: string;
  errorId: string;
  /** invalid ? errorId : hint ? hintId : undefined */
  describedBy: string | undefined;
  invalid: boolean;
}

/**
 * 컨트롤이 자기 id·aria 배선을 얻는 훅.
 *
 * 모듈 전역 카운터는 SSR/CSR 값이 어긋나 하이드레이션 미스매치를 내므로
 * `React.useId()`를 쓴다.
 */
export function useFieldIds(
  idProp: string | undefined,
  o: { hint?: string; error?: string },
): FieldIds {
  const reactId = React.useId();
  const controlId = idProp ?? `input-${reactId}`;
  const invalid = Boolean(o.error);
  const hintId = hintIdOf(controlId);
  const errorId = errorIdOf(controlId);

  return {
    controlId,
    hintId,
    errorId,
    describedBy: invalid ? errorId : o.hint ? hintId : undefined,
    invalid,
  };
}

export interface FieldProps
  extends Omit<React.ComponentProps<"div">, "children"> {
  /** 라벨이 가리키는 컨트롤의 id — `useFieldIds().controlId`를 넘긴다 */
  controlId: string;
  /** 컨트롤 위 라벨 */
  label?: string;
  /** true면 라벨에 danger `*`(aria-hidden — 필수 여부는 컨트롤의 required가 전달) */
  required?: boolean;
  /** 컨트롤 아래 보조 설명 — error가 있으면 렌더하지 않는다 */
  hint?: string;
  /** 에러 메시지 — hint를 대체한다 */
  error?: string;
  /** 컨트롤 본체 */
  children: React.ReactNode;
}

export function Field({
  className,
  controlId,
  label,
  required,
  hint,
  error,
  children,
  ...props
}: FieldProps) {
  const invalid = Boolean(error);

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)} {...props}>
      {label ? (
        <label
          htmlFor={controlId}
          className="text-base leading-cozy font-semibold tracking-normal text-fg"
        >
          {label}
          {required ? (
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {children}

      {hint && !invalid ? (
        <span
          id={hintIdOf(controlId)}
          className="text-sm leading-cozy text-fg-muted"
        >
          {hint}
        </span>
      ) : null}

      {invalid ? (
        <span
          id={errorIdOf(controlId)}
          className="text-sm leading-cozy text-danger"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
