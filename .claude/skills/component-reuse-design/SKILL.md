---
name: component-reuse-design
description: "디자인 스펙을 재사용 가능한 컴포넌트 구조로 설계하고 중복을 제거할 때 사용. 기존 src/components를 스캔해 재사용/확장/신규를 결정하고, 컴포넌트 트리·props API(TypeScript)·cva variant·파일 배치·필요한 디자인 토큰을 명세한다. '실무 회사처럼' 중복 없는 컴포넌트 라이브러리를 만들 때 반드시 사용. component-architect 에이전트 전용."
---

# Component Reuse Design

디자인 스펙을 실무 수준의 컴포넌트 구조로 설계하는 절차. 이 하네스의 핵심 가치 **"중복 코드는 컴포넌트로 분리한다"**를 책임진다.

## 이 프로젝트의 컴포넌트 구조 규약

```
src/
├─ app/                    # 라우트(페이지). 페이지는 컴포넌트를 조립만 한다
├─ components/
│  ├─ ui/                  # 범용 프리미티브 (Button, Input, Card, Badge…)
│  │                       # 여러 화면/도메인에서 재사용. 도메인 지식 없음
│  └─ {domain}/            # 도메인 합성 컴포넌트 (StatCard, UserMenu…)
│                          # 프리미티브를 조합, 특정 기능 영역에 종속
└─ lib/
   └─ utils.ts             # cn() — clsx + tailwind-merge
```

**계층 원칙:** 페이지는 합성 컴포넌트를 조립하고, 합성 컴포넌트는 프리미티브를 조합하고, 프리미티브는 순수 UI다. 아래에서 위로 재사용된다.

## 1단계: 기존 코드베이스 스캔 (설계보다 먼저)

**설계 전에 반드시 실행한다.** 이미 있는 Button을 또 만드는 것이 가장 흔한 중복이다.

- **먼저 `src/components/README.md`의 "컴포넌트 인벤토리" 표를 Read**한다. 이미 있는 재사용 컴포넌트를 한눈에 파악하는 가장 빠른 길이다.
- `src/components/ui/`와 `src/components/`의 모든 컴포넌트를 Glob으로 나열하고 Read
- 각 컴포넌트의 props/variant를 파악해 "재사용 가능 목록"을 만든다
- `src/app/globals.css`의 `@theme` 블록을 읽어 이미 정의된 토큰을 파악한다

이 스캔 결과를 계획서 최상단에 기록한다. 이후 모든 재사용 결정의 근거가 된다.

## 2단계: 재사용 결정

스펙의 각 컴포넌트 인벤토리 항목에 대해 결정한다:

| 상황 | 결정 |
|------|------|
| 기존 컴포넌트가 완전히 충족 | **재사용** — 신규 생성 금지, 기존 것 임포트 |
| 기존 컴포넌트 + variant/prop 추가로 충족 | **확장** — 기존 컴포넌트에 cva variant 추가 |
| 화면에 2회 이상 반복되는 새 UI | **신규(공유)** — 프리미티브 또는 도메인 컴포넌트로 추출 |
| 여러 화면에서 쓸 범용 UI | **신규(프리미티브)** — `components/ui/`에 |
| 이 도메인 전용 합성 | **신규(도메인)** — `components/{domain}/`에 |
| 1회용 + 재사용 가능성 없는 레이아웃 | **인라인** — 페이지/부모에 유지 (과도 추상화 금지) |

결정을 표로 기록한다: `요청 단위 | 결정 | 대상 컴포넌트 | 근거`.

## 3단계: 중복 통합 판단

스펙에서 "반복 — 중복 후보"로 표시된 항목을 처리한다.

**균형점: 2회 반복이면 추출, 미래 재사용이 명확하면 선제 추출, 1회용은 인라인.**

미묘하게 다른 반복(색만 다른 카드 4개, active만 다른 nav 항목)은 **하나의 컴포넌트 + variant**로 통합할 수 있는지 먼저 검토한다. cva로 표현 가능하면 통합이 정답이다.

```
StatCard 4개 (파랑/초록/주황/빨강) → StatCard 1개 + variant: { tone: 'info'|'success'|'warning'|'danger' }
```

단, variant로 묶으면 오히려 복잡해지는 경우(구조 자체가 다름)는 별도 컴포넌트로 둔다. 통합의 목적은 중복 제거지 억지 일반화가 아니다.

## 4단계: 컴포넌트 트리 설계

화면을 계층으로 그린다. 페이지 → 합성 → 프리미티브.

```
DashboardPage
├─ AppHeader (도메인)
│  ├─ Logo (프리미티브)
│  ├─ NavLink × N (프리미티브, variant: active)
│  └─ UserMenu (도메인)
│     └─ Avatar + DropdownMenu (프리미티브)
├─ Sidebar (도메인)
│  └─ NavItem × N (프리미티브)
└─ StatGrid (도메인)
   └─ StatCard × 4 (도메인, variant: tone)
```

## 5단계: 컴포넌트별 명세

신규/변경 컴포넌트마다 구현자가 해석할 여지 없이 명세한다:

```
### StatCard — src/components/dashboard/stat-card.tsx
props:
  interface StatCardProps {
    label: string
    value: number | string
    delta?: number
    tone?: 'info' | 'success' | 'warning' | 'danger'  // 기본 'info'
  }
variant (cva):
  tone: info=border-info/…, success=…, warning=…, danger=…
접근성:
  <article>, 값에 aria-label, delta에 상승/하락 텍스트 병기
서버/클라이언트:
  서버 컴포넌트 (상호작용 없음)
```

**props API는 실제 TypeScript 코드 수준으로.** variant는 cva 구조로. 이것이 구현자의 계약이다.

## 6단계: 디자인 토큰 추가분

스펙의 토큰 중 기존 `@theme`에 없는 것을 식별하고, 넣을 정의를 명시한다. Tailwind v4이므로 `tailwind.config.js`가 아니라 `globals.css`의 `@theme` 블록이다.

```
globals.css @theme에 추가:
  --color-primary: #4f46e5;
  --color-success: #16a34a;
  --radius-card: 0.75rem;
```

## 7단계: 구현 순서

의존성 역순으로: **프리미티브 먼저 → 합성 → 페이지 조립**. 구현자가 아래에서 위로 쌓도록 순서를 명시한다.

## 출력

`_workspace/02_component-plan.md`:
기존 스캔 결과 → 재사용 결정 → 컴포넌트 트리 → 컴포넌트별 명세 → 토큰 추가분 → 구현 순서.

## 원칙 요약
- **기존 것을 먼저 스캔한다.** 재사용 결정의 근거는 실제 코드베이스다.
- **중복은 제거하되 억지 추상화는 금지.** 2회 반복=추출, 1회용=인라인.
- **props API를 코드 수준으로.** 구현자가 해석하지 않게.
- **variant는 cva, 토큰은 globals.css.** 이 스택의 표준 패턴을 강제한다.
- **설계만 한다.** 구현은 frontend-implementer의 몫이다.
