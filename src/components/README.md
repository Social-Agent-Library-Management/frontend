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
| `Input` | `ui` | `invalid`(error prop에서 파생) — 껍데기는 `Field`에 위임 | `#3` |
| `Field` | `ui` | 없음 (`label`/`hint`/`error`/`required`/`controlId` — hint↔error 배타 렌더) | `#9` |
| `Combobox` | `ui` | 옵션 `active`(true·false) × `selected`(true·false) (cva). 입력창은 `Input`의 `inputVariants` 재사용 | `#9` |
| `Card` | `ui` | `padding`(sm·md·lg), `noPadding`, `titleAs`(h2·h3) | `#3` |
| `Pagination` | `ui` | (내부 PageButton `state`: default·active) | `#3` |
| `DataTable` | `ui` | 없음 (제네릭 `T` — columns/rows 주도. 페이지네이션은 `pageSize`=클라이언트 / `serverPagination`=서버) | `#3` |
| `PagePlaceholder` | `ui` | 없음 (`title` / `description` prop) | `#5` |
| `PageHeader` | `ui` | 없음 (`title` / `description` / `actions` prop) | `#7` |
| `Toast` | `ui` | `tone`(success·danger) | `#7` |
| `StatusBadge` | `library` | `status` 7종 → Badge `tone` 매핑, `size` 위임 | `#3` |
| `StatCard` | `library` | `tone`(primary·success·warning·danger·copy·neutral) × `subTone`(muted·success·warning·danger·primary) | `#3` |
| `DdayCard` | `library` | `urgency`(urgent·warning·normal — `daysLeft`에서 파생) | `#3` |
| `Sidebar` | `library` | nav item `active`(true·false) | `#3` |
| `AppSidebar` | `library` | 없음 (`Sidebar`에 위임) | `#5` |
| `BookRegisterForm` | `library` | 없음 | `#7` |
| `BookListCard` | `library` | 없음 | `#7` |
| `BookRegisterSection` | `library` | 없음 | `#7` |
| `BookSelectField` | `library` | 없음 | `#9` |
| `CopyRegisterForm` | `library` | 없음 | `#9` |
| `LoanRegisterForm` | `library` | 없음 | `#11` |
| `LoanListCard` | `library` | 없음 | `#11` |
| `LoanRegisterSection` | `library` | 없음 | `#11` |
| `icons/*` | `icons` | 없음 (`IconProps` = SVG props, `currentColor`) | `#3` |

> 계층: `ui`(프리미티브) 또는 도메인명(예: `dashboard`). variant는 cva로 정의된 축(예: `tone`, `size`). 최초 도입은 이슈/PR 번호(예: `#5`).

### 합성 관계 (중복 재발 방지용)

- `StatusBadge` → `Badge`  (상태 배지를 직접 만들지 말 것)
- `DdayCard` → `Badge`(solid) + `IconBox` + `IconCalendar` + `lib/dday`
- `StatCard` → `IconBox`
- `Sidebar` → `IconBox` + `icons` + `nav-items`
- `AppSidebar` → `Sidebar` + `resolveActiveNavId`  (**레이아웃에서는 `Sidebar`를 직접 쓰지 말고 `AppSidebar`를 쓸 것** — activeId를 손으로 계산하지 않는다)
- `PagePlaceholder` → `PageHeader` + `Card`
- `Toast` → `IconCheckCircle` / `IconAlertCircle` / `IconClose`
- `BookRegisterSection` → `BookRegisterForm` + `BookListCard`  (**페이지에서 폼·목록을 직접 배치하지 말 것** — refreshToken 배선을 손으로 하지 않는다)
- `BookRegisterForm` → `Card` + `Input` + `Button` + `Toast` + `lib/api/books`
- `Input` → `Field`
- `Combobox` → `Field` + `Input`의 `inputVariants`  (**검색형 선택 UI를 새로 만들지 말 것** — 라벨/힌트/에러 껍데기와 리스트박스 ARIA·키보드 처리가 이미 여기 있다)
- `BookSelectField` → `Combobox` + `lib/api/books`(`searchBooks`)  (**도서 선택 UI가 필요하면 이걸 쓸 것** — 디바운스·요청 취소·경합 처리를 손으로 하지 않는다)
- `CopyRegisterForm` → `Card` + `BookSelectField` + `Input` + `StatusBadge` + `Button` + `Toast` + `lib/api/bookitems`
- `BookListCard` → `Card` + `Badge` + `DataTable` + `lib/api/books`
- `LoanRegisterSection` → `LoanRegisterForm` + `LoanListCard`  (**페이지에서 폼·목록을 직접 배치하지 말 것** — refreshToken 배선을 손으로 하지 않는다)
- `LoanRegisterForm` → `Card` + `Input` + `Button` + `Toast` + `IconCalendar` + `lib/api/loans`  (관리번호는 plain `Input`이다 — 아래 검색형 선택 문단 참조)
- `LoanListCard` → `Card` + `DataTable` + `StatusBadge` + `lib/api/loans`  (연체 배지는 서버가 내려준 `overdue`를 그대로 쓴다 — 프론트에서 날짜를 재계산하지 않는다)
- `DataTable` → `Pagination`  (**서버 페이지네이션이 필요하면 `serverPagination` prop을 쓸 것** — `Pagination`을 표 아래에 따로 붙이지 않는다)

`ui/Combobox`는 도메인을 모르는 검색-선택 프리미티브다. 새 검색 필드가 필요하면 `ui/`에 두 번째 콤보박스를 만들지 말고, `library/`에 `BookSelectField`처럼 API 배선만 하는 얇은 래퍼를 추가한다. **단, 검색 엔드포인트가 있을 때만이다** — `/loans/new`의 관리번호는 백엔드에 소장본 검색/목록 API가 없어(`findByManagementNumber` 단건 조회뿐) plain `Input` + 서버 에러 코드(`BOOK_ITEM_NOT_FOUND`/`BOOK_ITEM_NOT_AVAILABLE`) 필드 에러로 처리한다(`#11`). 대출자·부서도 "회원" 도메인이 없어 자유 텍스트다.

페이지 좌우/상하 여백은 `src/app/layout.tsx`의 `<main>`이 소유한다. 페이지·컴포넌트에서 `px-page-x py-page-y`를 다시 쓰지 않는다.

백엔드 호출은 `src/lib/api/`(`client.ts` 공통 + 도메인별 파일)를 통해서만 한다. 컴포넌트에서 `fetch`를 직접 부르지 않는다. 에러는 `ApiError`로 정규화되며 사용자 노출 문구는 `error.detail`이다. 목록 응답의 `pagination` 봉투 타입(`PaginationMeta`)도 도메인 공통이라 `client.ts`가 소유한다 — 도메인 파일에 복제하지 않는다.

파생 로직은 `src/lib/dday.ts`(`getUrgency` / `formatDday`)에 있다. 연체 관련 화면은 이 함수를 재사용한다.

라우트 경로는 `src/components/library/nav-items.tsx`의 `LIBRARY_NAV_ITEMS[].href`가 단일 진실 원천이다. 새 화면을 추가하면 여기에 항목을 넣고 `src/app/**`에 대응 라우트를 만든다.

`PagePlaceholder`는 화면 구현 전 스캐폴딩이다. 모든 화면이 구현되어 사용처가 0이 되면 삭제한다.
