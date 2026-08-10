import type * as React from "react";

/**
 * 아이콘 공통 props.
 *
 * 원본(`Sidebar.jsx`)은 `color: string` prop을 받아 CSS 변수 문자열을 주입했다.
 * 그 구조는 호출부마다 색을 하드코딩하게 만들므로 `stroke="currentColor"`로 바꿨다.
 * → 부모의 `text-*` 유틸리티가 그대로 아이콘 색을 결정한다.
 */
export type IconProps = React.ComponentProps<"svg">;

type IconBaseProps = IconProps & {
  /** 정사각 픽셀 크기. viewBox도 동일 치수로 맞춘다. */
  size?: number;
};

function IconBase({
  size = 20,
  strokeWidth = 1.5,
  children,
  ...props
}: IconBaseProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/**
 * 크기를 호출부가 정하는 아이콘의 props.
 *
 * 기존 내비게이션 아이콘들은 20×20 한 가지 크기로만 쓰여 `size`를 노출하지 않는다.
 * 아래 알림용 아이콘 3종은 `Toast`가 18/16px로 축소해 쓰므로 `size`를 받는다.
 * 이때 `viewBox`를 20 고정으로 덮어써야 20 좌표계로 그린 도형이 잘리지 않고
 * 그대로 축소된다(`IconBase`는 기본적으로 viewBox를 size에 맞춘다).
 */
export type SizedIconProps = IconProps & {
  /** 정사각 픽셀 크기. 기본 20 */
  size?: number;
};

export function IconDashboard(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="2" y="2" width="7" height="8" rx="1.5" />
      <rect x="11" y="2" width="7" height="5" rx="1.5" />
      <rect x="2" y="13" width="7" height="5" rx="1.5" />
      <rect x="11" y="10" width="7" height="8" rx="1.5" />
    </IconBase>
  );
}

export function IconBook(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 3h10v14H4z" strokeLinejoin="round" />
      <path d="M10 3v14" />
      <path d="M6 7h4M6 10h4" />
    </IconBase>
  );
}

export function IconCopy(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="2" y="5" width="12" height="13" rx="1.5" />
      <path d="M6 2h10a1.5 1.5 0 0 1 1.5 1.5V16" />
    </IconBase>
  );
}

export function IconLoan(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M4 17V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12"
        strokeLinejoin="round"
      />
      <path d="M2 17h16" />
      <path d="M8 8h4M8 11h4" />
    </IconBase>
  );
}

export function IconReturn(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 10a6 6 0 1 1 1.5 4" />
      <path d="M4 14v-4h4" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconHistory(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l3 2" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconOverdue(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v5" />
      <path d="M10 13.5v.5" strokeWidth="2" />
    </IconBase>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="2" y="3" width="16" height="15" rx="2" />
      <path d="M6 1v4M14 1v4" />
      <path d="M2 8h16" />
      <path d="M5 12h4M5 15h3" />
    </IconBase>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <IconBase size={16} {...props}>
      <path d="M10 3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3" />
      <path d="M7 5l-3 3 3 3M4 8h8" strokeLinejoin="round" />
    </IconBase>
  );
}

/** 성공 알림용 — 원 + 체크 (`Toast` tone="success") */
export function IconCheckCircle({ size = 20, ...props }: SizedIconProps) {
  return (
    <IconBase size={size} viewBox="0 0 20 20" {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M6.6 10.2l2.3 2.3 4.5-4.8" strokeLinejoin="round" />
    </IconBase>
  );
}

/** 실패 알림용 — 원 + 느낌표 (`Toast` tone="danger") */
export function IconAlertCircle({ size = 20, ...props }: SizedIconProps) {
  return (
    <IconBase size={size} viewBox="0 0 20 20" {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6.2v4.6" />
      <path d="M10 13.4v.4" strokeWidth="2" />
    </IconBase>
  );
}

/** 닫기 — X 두 선 (`Toast` 닫기 버튼) */
export function IconClose({ size = 20, ...props }: SizedIconProps) {
  return (
    <IconBase size={size} viewBox="0 0 20 20" {...props}>
      <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
    </IconBase>
  );
}

export function IconLogo(props: IconProps) {
  return (
    <IconBase size={22} strokeWidth={2} {...props}>
      <path d="M4 5h14M4 9h14M4 13h10M4 17h14" />
    </IconBase>
  );
}
