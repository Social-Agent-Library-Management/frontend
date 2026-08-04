---
name: nextjs-implementation
description: "컴포넌트 설계를 Next.js(App Router) + React + TypeScript + Tailwind v4 실제 코드로 구현할 때 사용. 이 프로젝트는 Next.js 16 / React 19 / Tailwind v4(CSS @theme 설정)다. Server/Client 컴포넌트 경계, cva variant, cn() 병합, globals.css 토큰, App Router 규칙을 따라 재사용 컴포넌트를 만들고 페이지를 조립한다. frontend-implementer 에이전트 전용."
---

# Next.js Implementation

컴포넌트 설계(`_workspace/02_component-plan.md`)를 동작하는 코드로 옮기는 절차. 재사용·타입안전·접근성을 실무 시니어 수준으로 지킨다.

## 이 프로젝트가 학습 데이터와 다른 점 (반드시 인지)

이 프로젝트는 **Next.js 16 / React 19 / Tailwind v4**다. 과거 버전과 다른 지점:

| 영역 | 이 프로젝트의 방식 |
|------|------------------|
| Tailwind 설정 | `tailwind.config.js` **없음**. `src/app/globals.css`의 `@import "tailwindcss"` + `@theme` 블록에 CSS 변수로 토큰 정의 |
| 동적 라우트 params | `params`/`searchParams`가 **Promise**. `const { id } = await params` |
| 기본 컴포넌트 | Server Component가 기본. 상호작용 시에만 `"use client"` |
| 캐싱/동적 API | `cookies()`, `headers()` 등이 비동기. 확신 없으면 문서 확인 |

**확신이 없으면 추측하지 않는다.** `node_modules/next/dist/docs/01-app/`의 해당 가이드를 Read한 뒤 작성한다. 특히 `03-api-reference/03-file-conventions`(page/layout/route), `03-api-reference/04-functions`를 참조한다.

## 구현 순서

계획의 "구현 순서"를 따른다. 항상 **아래에서 위로**: 프리미티브 → 합성 컴포넌트 → 페이지 조립. 하위가 완성돼야 상위를 조립할 수 있다.

## 1. 재사용 컴포넌트 (프리미티브) 작성

variant가 있는 프리미티브는 **cva + cn** 표준 패턴으로 만든다. 조건부 className을 손으로 잇지 않는다.

```tsx
// src/components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        ghost: "hover:bg-muted",
      },
      size: { sm: "h-8 px-3 text-sm", md: "h-10 px-4", lg: "h-12 px-6 text-lg" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

**핵심:**
- 스타일 변형은 `cva`의 `variants`로. 소비자는 `<Button variant="ghost" size="sm" />`.
- `className` prop을 항상 마지막에 `cn()`으로 병합 — 호출부 오버라이드 허용.
- 네이티브 요소를 확장할 땐 해당 HTML 속성 타입을 상속(`ButtonHTMLAttributes` 등).
- 색은 `@theme` 토큰 유틸(`bg-primary`)로. 하드코딩 hex 금지.

## 2. Server / Client 경계

React 19 + App Router: **기본은 Server Component.** `"use client"`는 다음이 필요할 때만 파일 최상단에 붙인다:
- `useState`/`useEffect`/`useRef` 등 훅
- 이벤트 핸들러(`onClick` 등)
- 브라우저 API(`window`, `localStorage`)

**상호작용 부분만 작게 분리한다.** 페이지 전체를 클라이언트로 만들지 말고, 버튼/토글 같은 인터랙션만 작은 클라이언트 컴포넌트로 떼고 나머지는 서버 컴포넌트로 둔다.

```tsx
// 나쁨: 페이지 전체 "use client"
// 좋음: 서버 페이지 + <LikeButton /> 만 "use client"
```

## 3. 합성 컴포넌트

프리미티브를 조합한다. 데이터는 props로 받고, 타입은 스펙의 "데이터 shape"에서 끌어온다.

```tsx
// src/components/dashboard/stat-card.tsx
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: number | string;
  delta?: number;
  tone?: "info" | "success" | "warning" | "danger";
}

const toneMap = {
  info: "border-info",
  success: "border-success",
  warning: "border-warning",
  danger: "border-danger",
} as const;

export function StatCard({ label, value, delta, tone = "info" }: StatCardProps) {
  return (
    <article className={cn("rounded-card border-l-4 bg-surface p-4", toneMap[tone])}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {delta !== undefined && (
        <p className={cn("text-sm", delta >= 0 ? "text-success" : "text-danger")}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
          <span className="sr-only">{delta >= 0 ? "상승" : "하락"}</span>
        </p>
      )}
    </article>
  );
}
```

## 4. 반복 렌더링 (DRY)

같은 컴포넌트가 여러 번 나오면 배열 + `map`으로 렌더링한다. 마크업을 복붙하지 않는다.

```tsx
const stats: StatCardProps[] = [ /* … */ ];
return <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
  {stats.map((s) => <StatCard key={s.label} {...s} />)}
</section>;
```

## 5. 디자인 토큰 추가

계획의 "토큰 추가분"을 `src/app/globals.css`의 `@theme`에 넣는다. `@theme`에 정의하면 Tailwind가 해당 유틸리티를 자동 생성한다(`--color-primary` → `bg-primary`, `text-primary`).

```css
@theme {
  --color-primary: #4f46e5;
  --color-primary-foreground: #ffffff;
  --color-success: #16a34a;
  --radius-card: 0.75rem;
}
```

## 6. 페이지 조립 (App Router)

페이지는 `src/app/{route}/page.tsx`. 컴포넌트를 **조립만** 하고 로직/마크업 중복을 두지 않는다. 동적 세그먼트는 `[id]`, params는 await한다.

```tsx
// src/app/dashboard/page.tsx
export default function DashboardPage() {
  return <main>{/* 합성 컴포넌트 조립 */}</main>;
}
```

## 7. 반응형

Tailwind 브레이크포인트 접두사(`md:`, `lg:`)로 스펙의 반응형 규칙을 구현한다. 모바일 우선(base = 모바일, 접두사로 확대).

## 문서 동기화 (필수)

**재사용 컴포넌트(ui/ 또는 도메인)를 새로 만들거나 variant를 바꾸면 `src/components/README.md`의 "컴포넌트 인벤토리" 표를 같은 작업에서 갱신한다.**
- 새 컴포넌트: 표에 행 추가(컴포넌트 · 계층 · variant · 최초 도입=이슈/PR 번호).
- variant 추가/변경: 해당 행의 variant 열 갱신.
- 1회용(페이지 인라인) 마크업은 인벤토리에 넣지 않는다. **재사용 컴포넌트만** 기록.
- 이 갱신은 README 문서만 손대고, CLAUDE.md 변경 이력은 건드리지 않는다(그건 하네스 변경 전용).

## 자가 검증 (넘기기 전)

QA에 넘기기 전 스스로 확인한다:
- `npx tsc --noEmit` — 타입 에러 0
- `npm run build` — 빌드 통과
- `any`/우회 캐스팅 없음, 하드코딩 색/px 없음, 계획의 재사용 결정 준수
- **README 컴포넌트 인벤토리가 실제 재사용 컴포넌트와 일치**

## 출력

코드 파일 + `_workspace/03_implementation-report.md`(생성/수정 파일, 재사용한 기존 컴포넌트, 추가 토큰, 판단, 미완 항목).

## 원칙 요약
- **버전을 존중한다.** 확신 없으면 `node_modules/next/dist/docs/`를 읽는다.
- **variant는 cva, 병합은 cn, 토큰은 @theme.** 이 스택의 3대 표준.
- **DRY를 코드에서.** 2회 반복이면 컴포넌트/map으로.
- **Server 기본, Client는 최소.** 상호작용만 떼어낸다.
- **계획을 따른다.** 재사용 결정을 임의로 어기지 않는다.
