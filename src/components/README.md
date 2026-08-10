# 컴포넌트 구조 규약

이 하네스(design → frontend)는 **중복 없는 재사용 컴포넌트 라이브러리**를 지향한다.
컴포넌트는 두 계층으로 나눈다.

```
src/components/
├─ ui/          # 범용 프리미티브 — Button, Input, Card, Badge, Avatar …
│               #   여러 화면/도메인에서 재사용. 도메인 지식 없음.
│               #   variant는 class-variance-authority(cva)로 표현.
└─ {domain}/    # 도메인 합성 컴포넌트 — StatCard, UserMenu, ProductList …
                #   ui 프리미티브를 조합. 특정 기능 영역에 종속.
```

## 원칙
- **재사용 먼저.** 새 컴포넌트를 만들기 전 `ui/`와 도메인 폴더에 이미 있는지 확인한다.
- **2회 반복이면 추출**, 1회용 레이아웃은 페이지에 인라인(과도한 추상화 금지).
- **variant는 cva + `cn()`**(`@/lib/utils`). 조건부 className을 손으로 잇지 않는다.
- **스타일은 `@theme` 토큰**(`src/app/globals.css`). 하드코딩 hex/px 금지.
- **페이지는 조립만.** `src/app/**`의 page는 컴포넌트를 조합하고 로직/마크업 중복을 두지 않는다.

이 규약은 `.claude/skills/component-reuse-design`과 `.claude/skills/nextjs-implementation`이 강제한다.

## 컴포넌트 인벤토리

현재 존재하는 재사용 컴포넌트 목록이다. **하네스가 컴포넌트를 추가/변경할 때마다 이 표를 갱신한다.**
설계 단계(component-architect)는 새로 만들기 전에 이 표를 먼저 확인해 중복을 막는다.

| 컴포넌트 | 계층 | variant | 최초 도입 |
|---------|------|---------|----------|
| `IconBox` | `ui` | `size`(sm·md·lg) × `shape`(circle·rounded) | `#3` |
| `Badge` | `ui` | `variant`(soft·solid) × `tone`(neutral·primary·success·warning·danger·copy·muted) × `size`(sm·md·lg) | `#3` |
| `Button` | `ui` | `variant`(primary·secondary·ghost·danger·success) × `size`(sm·md·lg) × `fullWidth` | `#3` |
| `Input` | `ui` | `invalid`(error prop에서 파생) | `#3` |
| `Card` | `ui` | `padding`(sm·md·lg), `noPadding`, `titleAs`(h2·h3) | `#3` |
| `Pagination` | `ui` | (내부 PageButton `state`: default·active) | `#3` |
| `DataTable` | `ui` | 없음 (제네릭 `T` — columns/rows 주도) | `#3` |
| `StatusBadge` | `library` | `status` 7종 → Badge `tone` 매핑, `size` 위임 | `#3` |
| `StatCard` | `library` | `tone`(primary·success·warning·danger·copy·neutral) × `subTone`(muted·success·warning·danger·primary) | `#3` |
| `DdayCard` | `library` | `urgency`(urgent·warning·normal — `daysLeft`에서 파생) | `#3` |
| `Sidebar` | `library` | nav item `active`(true·false) | `#3` |
| `icons/*` | `icons` | 없음 (`IconProps` = SVG props, `currentColor`) | `#3` |

> 계층: `ui`(프리미티브) 또는 도메인명(예: `dashboard`). variant는 cva로 정의된 축(예: `tone`, `size`). 최초 도입은 이슈/PR 번호(예: `#5`).

### 합성 관계 (중복 재발 방지용)

- `StatusBadge` → `Badge`  (상태 배지를 직접 만들지 말 것)
- `DdayCard` → `Badge`(solid) + `IconBox` + `IconCalendar` + `lib/dday`
- `StatCard` → `IconBox`
- `Sidebar` → `IconBox` + `icons` + `nav-items`
- `DataTable` → `Pagination`  (페이지네이션이 필요하면 `Pagination`을 직접 쓸 것)

파생 로직은 `src/lib/dday.ts`(`getUrgency` / `formatDday`)에 있다. 연체 관련 화면은 이 함수를 재사용한다.
