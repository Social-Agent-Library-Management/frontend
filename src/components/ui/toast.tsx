"use client";

import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  IconAlertCircle,
  IconCheckCircle,
  IconClose,
} from "@/components/icons";

export type ToastTone = "success" | "danger";

export interface ToastProps
  extends Omit<React.ComponentProps<"div">, "children" | "role"> {
  /** 표시 여부 (controlled) */
  open: boolean;
  message: string;
  /** 기본 "success" */
  tone?: ToastTone;
  /** 자동 닫힘까지의 ms. 0이면 자동 닫힘 없음. 기본 2800 */
  duration?: number;
  onClose: () => void;
}

const toastVariants = cva(
  [
    "pointer-events-auto flex items-center gap-2.5 rounded-card border bg-surface",
    "px-4 py-3 text-body leading-cozy tracking-normal text-fg shadow-dropdown",
  ],
  {
    variants: {
      tone: {
        success: "border-success-light",
        danger: "border-danger-light",
      },
    },
    defaultVariants: { tone: "success" },
  },
);

/**
 * 하단 중앙 알림. 등록·반납·연체 처리 등 "성공/실패 한 줄 알림"을 전부 담당한다.
 *
 * live region(`role="status"`)은 `open`과 무관하게 항상 렌더한다 —
 * 나중에 DOM에 삽입되는 live region은 스크린리더가 낭독하지 않는다.
 * 같은 문구를 연속으로 다시 띄우려면 호출부가 `open`을 false→true로 토글한다.
 */
export function Toast({
  className,
  open,
  message,
  tone = "success",
  duration = 2800,
  onClose,
  ...props
}: ToastProps) {
  // onClose를 ref에 담아 타이머 effect의 deps에서 제외한다.
  // 그러지 않으면 호출부가 인라인 화살표 함수를 넘길 때 매 렌더마다 타이머가 리셋된다.
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    if (!open || duration <= 0) return;
    const timer = window.setTimeout(() => onCloseRef.current(), duration);
    return () => window.clearTimeout(timer);
  }, [open, message, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      {open ? (
        <div className={cn(toastVariants({ tone }), className)} {...props}>
          <span className={tone === "danger" ? "text-danger" : "text-success"}>
            {tone === "danger" ? (
              <IconAlertCircle size={18} />
            ) : (
              <IconCheckCircle size={18} />
            )}
          </span>
          <span>{message}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="알림 닫기"
            className="ml-1 shrink-0 rounded-sm text-fg-subtle transition-colors hover:text-fg-muted focus-ring"
          >
            <IconClose size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
