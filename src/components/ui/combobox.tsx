"use client";

import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Field, useFieldIds } from "@/components/ui/field";
import { inputVariants } from "@/components/ui/input";

/**
 * 도메인 지식이 0인 검색-선택 리스트박스 (WAI-ARIA 1.2 combobox 패턴).
 *
 * fetch·디바운스·도메인 타입을 알지 못한다 — `items`/`query`/`value`를 controlled로
 * 받기만 한다. API 배선은 `library/`의 얇은 래퍼가 한다(`BookSelectField` 참고).
 *
 * **핵심 불변식: 입력창에 보이는 텍스트와 `value`는 절대 어긋나지 않는다.**
 * `value !== null`인 상태에서 타이핑하면 먼저 `onChange(null)`을 호출한 뒤
 * `onQueryChange(next)`를 호출한다. 덕분에 "화면엔 도서명이 떠 있는데 내부 id는
 * 옛 항목을 가리키는" 상태가 구조적으로 불가능해진다.
 */

const comboboxOptionVariants = cva(
  [
    "flex w-full cursor-pointer flex-col items-start gap-0.5",
    "px-3 py-2 text-left text-body leading-cozy transition-colors duration-150",
  ],
  {
    variants: {
      active: {
        true: "bg-primary-light",
        false: "bg-transparent hover:bg-surface-muted",
      },
      selected: {
        true: "font-semibold text-fg",
        false: "font-normal text-fg",
      },
    },
    defaultVariants: { active: false, selected: false },
  },
);

/** 선택 불가 행(로딩·빈 결과)의 스타일. `role="option"`을 붙이지 않는다. */
const STATUS_ROW_CLASS = "px-3 py-2 text-body leading-cozy text-fg-muted";

export interface ComboboxProps<T> {
  /** 선택된 항목 (controlled). null = 미선택 */
  value: T | null;
  /** 선택 확정 / 선택 해제(null) */
  onChange: (item: T | null) => void;

  /** 입력창의 텍스트 (controlled) */
  query: string;
  /** 사용자가 타이핑할 때 호출. 호출부가 이 값으로 검색한다 */
  onQueryChange: (query: string) => void;

  /** 드롭다운 후보. 정렬·페이징은 호출부 책임 */
  items: T[];
  /** 안정적인 React key */
  getItemKey: (item: T) => string | number;
  /** 입력창과 옵션 1행에 표시할 텍스트 */
  getItemLabel: (item: T) => string;
  /** 옵션 2행 보조 텍스트 (없으면 1행만) */
  getItemDescription?: (item: T) => string | undefined;

  /** 조회 중 — 드롭다운에 "검색 중…", listbox에 aria-busy */
  loading?: boolean;
  /** items가 비고 loading이 아닐 때의 문구. 기본 "검색 결과가 없습니다." */
  emptyMessage?: string;

  /**
   * 드롭다운 열림 상태가 바뀔 때 호출.
   * 호출부가 "열려 있을 때만 조회"를 구현하기 위한 통지 채널이다
   * (열림 상태 자체는 이 컴포넌트가 소유한다 — 호출부가 제어하지 않는다).
   */
  onOpenChange?: (open: boolean) => void;

  // ── Field로 위임되는 필드 props ──
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;

  /** 검증 실패 시 호출부가 포커스를 되돌리기 위한 ref */
  inputRef?: React.Ref<HTMLInputElement>;
}

export function Combobox<T>({
  value,
  onChange,
  query,
  onQueryChange,
  items,
  getItemKey,
  getItemLabel,
  getItemDescription,
  loading = false,
  emptyMessage,
  onOpenChange,
  label,
  hint,
  error,
  required,
  disabled,
  placeholder,
  id,
  className,
  inputRef,
}: ComboboxProps<T>) {
  const { controlId, describedBy, invalid } = useFieldIds(id, { hint, error });
  const listboxId = `${controlId}-listbox`;

  const [openState, setOpenState] = React.useState(false);
  // disabled로 전환되면 열린 드롭다운이 닫힌다 — effect + setState로 맞추면
  // 캐스케이딩 렌더가 되므로 렌더 중에 파생시킨다.
  const open = openState && !disabled;
  const [rawActiveIndex, setRawActiveIndex] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);

  // 조회 중에는 이전 결과를 옵션으로 세지 않는다. 이 배열이 "화면에 보이는 옵션"의
  // 단일 진실 원천 — activeIndex·Enter 선택·aria-activedescendant가 전부 이걸 본다
  // (보이지 않는 항목이 Enter로 선택되는 사고를 막는다).
  const visibleItems = loading ? [] : items;
  // items가 줄어들어도 activeIndex가 범위를 벗어나지 않게 렌더 중 클램프한다
  // (effect + setState로 맞추면 캐스케이딩 렌더가 된다).
  const activeIndex =
    visibleItems.length === 0
      ? -1
      : Math.min(rawActiveIndex, visibleItems.length - 1);
  const activeOptionId =
    open && activeIndex >= 0 ? `${controlId}-opt-${activeIndex}` : undefined;

  const selectedKey = value === null ? null : getItemKey(value);

  const openDropdown = React.useCallback(() => setOpenState(true), []);
  const closeDropdown = React.useCallback(() => setOpenState(false), []);

  // 열림 상태 통지. setState 업데이터 안에서 콜백을 부르면 StrictMode의 이중 호출에
  // 노출되므로 effect로 뺀다. 콜백은 ref에 담아 deps에서 제외한다
  // (호출부가 인라인 화살표 함수를 넘겨도 통지가 매 렌더 반복되지 않게).
  const onOpenChangeRef = React.useRef(onOpenChange);
  React.useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);
  React.useEffect(() => {
    onOpenChangeRef.current?.(open);
  }, [open]);

  function selectItem(item: T) {
    // 선택 시에는 value와 텍스트를 함께 맞춘다 — 불변식의 반대 방향.
    onChange(item);
    onQueryChange(getItemLabel(item));
    closeDropdown();
  }

  function handleQueryChange(next: string) {
    // 불변식: 텍스트가 바뀌면 이전 선택은 즉시 무효다.
    if (value !== null) onChange(null);
    onQueryChange(next);
    setRawActiveIndex(0);
    openDropdown();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openDropdown();
        return;
      }
      // 경계에서 멈춘다(순환하지 않는다).
      setRawActiveIndex((prev) => {
        const current = Math.min(prev, Math.max(visibleItems.length - 1, 0));
        const next = event.key === "ArrowDown" ? current + 1 : current - 1;
        return Math.min(Math.max(next, 0), Math.max(visibleItems.length - 1, 0));
      });
      return;
    }

    if (event.key === "Enter") {
      // 닫혀 있으면 preventDefault 하지 않는다 — 폼 제출을 막지 않기 위함.
      if (!open) return;
      const item = activeIndex >= 0 ? visibleItems[activeIndex] : undefined;
      if (item === undefined) {
        event.preventDefault();
        closeDropdown();
        return;
      }
      event.preventDefault();
      selectItem(item);
      return;
    }

    if (event.key === "Escape") {
      // 드롭다운만 닫는다. stopPropagation 하지 않는다.
      if (open) closeDropdown();
      return;
    }

    if (event.key === "Tab") {
      closeDropdown();
    }
  }

  // 외부 클릭으로 닫기. value는 건드리지 않는다.
  React.useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target)) return;
      closeDropdown();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, closeDropdown]);

  // 활성 옵션을 시야에 유지한다.
  React.useEffect(() => {
    if (!open || activeOptionId === undefined) return;
    document
      .getElementById(activeOptionId)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeOptionId]);

  return (
    <Field
      className={className}
      controlId={controlId}
      label={label}
      required={required}
      hint={hint}
      error={error}
    >
      <div className="relative" ref={rootRef}>
        <input
          id={controlId}
          ref={inputRef}
          role="combobox"
          type="text"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (!disabled) openDropdown();
          }}
          onClick={() => {
            if (!disabled) openDropdown();
          }}
          onBlur={closeDropdown}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={inputVariants({ invalid })}
        />

        {open ? (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={label}
            aria-busy={loading}
            // 옵션 영역을 눌러도 입력창의 포커스를 잃지 않게 한다(blur → 닫힘 방지).
            onMouseDown={(event) => event.preventDefault()}
            className={cn(
              "absolute z-20 mt-1 max-h-64 w-full overflow-y-auto",
              "rounded-input border border-line bg-surface shadow-dropdown",
            )}
          >
            {loading ? (
              <li role="presentation" className={STATUS_ROW_CLASS}>
                검색 중…
              </li>
            ) : visibleItems.length === 0 ? (
              <li role="presentation" className={STATUS_ROW_CLASS}>
                {emptyMessage ?? "검색 결과가 없습니다."}
              </li>
            ) : (
              visibleItems.map((item, index) => {
                const description = getItemDescription?.(item);
                const selected =
                  selectedKey !== null && getItemKey(item) === selectedKey;

                return (
                  <li
                    key={getItemKey(item)}
                    id={`${controlId}-opt-${index}`}
                    role="option"
                    aria-selected={selected}
                    // blur보다 먼저 실행되도록 onMouseDown에서 선택을 확정한다.
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectItem(item);
                    }}
                    onMouseEnter={() => setRawActiveIndex(index)}
                    className={comboboxOptionVariants({
                      active: index === activeIndex,
                      selected,
                    })}
                  >
                    <span>{getItemLabel(item)}</span>
                    {description ? (
                      <span className="text-sm leading-cozy text-fg-muted">
                        {description}
                      </span>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>
    </Field>
  );
}
