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
| `IconBox` | `ui` | `size`(sm·md·lg) × `shape`(circle·rounded·card — `card`는 `#27`에서 추가) | `#3` |
| `Badge` | `ui` | `variant`(soft·solid) × `tone`(neutral·primary·success·warning·danger·copy·muted) × `size`(sm·md·lg) | `#3` |
| `Button` | `ui` | `variant`(primary·secondary·ghost·danger·success) × `size`(sm·md·lg) × `fullWidth` | `#3` |
| `Input` | `ui` | `invalid`(error prop에서 파생) × `hasLeadingIcon`(leadingIcon prop에서 파생) — 껍데기는 `Field`에 위임 | `#3` |
| `Field` | `ui` | 없음 (`label`/`hint`/`error`/`required`/`controlId` — hint↔error 배타 렌더) | `#9` |
| `Combobox` | `ui` | 옵션 `active`(true·false) × `selected`(true·false) (cva). 입력창은 `Input`의 `inputVariants` 재사용 | `#9` |
| `Card` | `ui` | `padding`(sm·md·lg), `noPadding`, `titleAs`(h2·h3) | `#3` |
| `Pagination` | `ui` | (내부 PageButton `state`: default·active) | `#3` |
| `DataTable` | `ui` | 없음 (제네릭 `T` — columns/rows 주도. 페이지네이션은 `pageSize`=클라이언트 / `serverPagination`=서버) | `#3` |
| `PageHeader` | `ui` | 없음 (`title` / `description` / `actions` prop) | `#7` |
| `Toast` | `ui` | `tone`(success·danger) | `#7` |
| `ListErrorState` | `ui` | 없음 (`message` / `onRetry` / `retryLabel` prop) | `#17` |
| `Toggle` | `ui` | `checked`(true·false) — 트랙/손잡이 cva 2개(`toggleTrackVariants`/`toggleThumbVariants`) | `#27` |
| `CheckCard` | `ui` | `checked`(true·false) | `#27` |
| `EmptyCell` | `ui` | 없음 (`label` = sr-only 사유) | `#37` |
| `StatusBadge` | `library` | `status` 7종 → Badge `tone` 매핑, `size` 위임 | `#3` |
| `StatCard` | `library` | `tone`(primary·success·warning·danger·copy·neutral) × `subTone`(muted·success·warning·danger·primary) | `#3` |
| `DdayCard` | `library` | `urgency`(urgent·warning·normal — `daysLeft`에서 파생) | `#3` |
| `Sidebar` | `library` | nav item `active`(true·false) | `#3` |
| `AppSidebar` | `library` | 없음 (`Sidebar`에 위임) | `#5` |
| `AdminTabs` | `library` | 탭 `active`(true·false) — 밑줄(`border-b-2`) 축. 사이드바 `navItemVariants`(배경 축)와 별개 | `#31` |
| `BookRegisterForm` | `library` | 없음 | `#7` |
| `BookListCard` | `library` | 없음 | `#7` |
| `BookRegisterSection` | `library` | 없음 | `#7` |
| `BookSelectField` | `library` | 없음 | `#9` |
| `CopyRegisterForm` | `library` | 없음 | `#9` |
| `LoanRegisterForm` | `library` | 없음 | `#11` |
| `LoanListCard` | `library` | 없음 | `#11` |
| `LoanRegisterSection` | `library` | 없음 | `#11` |
| `ReturnListCard` | `library` | 없음 | `#13` |
| `LoanHistoryCard` | `library` | 없음 | `#15` |
| `BookSearchResultCard` | `library` | 없음 | `#23` |
| `BookCopiesCard` | `library` | 없음 | `#23` |
| `BookSearchSection` | `library` | 없음 | `#23` |
| `CopyListCard` | `library` | 없음 | `#25` |
| `CopyRegisterSection` | `library` | 없음 | `#25` |
| `ImportResultBanner` | `library` | `tone`(success·danger) → 아이콘 박스 색 + 아이콘 컴포넌트 매핑 | `#27` |
| `ExcelFileDropzone` | `library` | `dragging`(true·false — 내부 상태에서 파생) | `#27` |
| `ExcelImportForm` | `library` | 없음 | `#27` |
| `ExcelImportResult` | `library` | 없음 | `#27` |
| `ExcelImportSection` | `library` | 없음 | `#27` |
| `ExportSheetSelectCard` | `library` | 없음 | `#27` |
| `ExportOptionsCard` | `library` | 없음 | `#27` |
| `DataExportSection` | `library` | 없음 | `#27` |
| `RecentLoansCard` | `library` | 없음 | `#37` |
| `OverdueListCard` | `library` | 없음 | `#37` |
| `DashboardSection` | `library` | 없음 | `#37` |
| `icons/*` | `icons` | 없음 (`IconProps` = SVG props, `currentColor`) | `#3` |

> 계층: `ui`(프리미티브) 또는 도메인명(예: `dashboard`). variant는 cva로 정의된 축(예: `tone`, `size`). 최초 도입은 이슈/PR 번호(예: `#5`).

### 합성 관계 (중복 재발 방지용)

- `StatusBadge` → `Badge`  (상태 배지를 직접 만들지 말 것)
- `DdayCard` → `Badge`(solid) + `IconBox` + `IconCalendar` + `lib/dday`
- `StatCard` → `IconBox`
- `Sidebar` → `IconBox` + `icons` + `nav-items`  (최상위 nav는 5개다. 도서 등록·소장본 등록·대출 내역 조회는 `#31`에서 최상위 nav에서 빠져 관리자 페이지 탭(`AdminTabs`)으로 옮겼다 — 화면 자체는 이동만 했고 컴포넌트는 그대로다. `/admin/**` 어디에 있어도 `"admin"` 항목 하나만 활성이다(접두 일치))
- `AppSidebar` → `Sidebar` + `resolveActiveNavId`  (**레이아웃에서는 `Sidebar`를 직접 쓰지 말고 `AppSidebar`를 쓸 것** — activeId를 손으로 계산하지 않는다)
- `AdminTabs` → `nav-items`(`ADMIN_TAB_ITEMS` + `resolveActiveNavId`) + `next/link`  (**관리자 탭 바를 `src/app/admin/layout.tsx` 안에 인라인으로 다시 그리지 말 것.** 경로→활성 판정은 사이드바와 **같은 `resolveActiveNavId`**를 쓴다 — 두 번째 매칭 구현 금지. `Sidebar`/`AppSidebar`처럼 프레젠테이션·어댑터로 쪼개지 않은 이유는 마운트 지점이 하나뿐이기 때문이다 — 두 번째 소비처가 생기면 그때 `activeId` prop을 뽑는다. `role="tablist"`/`role="tab"`을 붙이지 말 것 — ARIA 탭 위젯이 아니라 라우트 링크 목록이다)
- `Toast` → `IconCheckCircle` / `IconAlertCircle` / `IconClose`
- `BookRegisterSection` → `BookRegisterForm` + `BookListCard`  (**페이지에서 폼·목록을 직접 배치하지 말 것** — refreshToken 배선을 손으로 하지 않는다)
- `BookRegisterForm` → `Card` + `Input` + `Button` + `Toast` + `lib/api/books`
- `Input` → `Field`  (`leadingIcon`은 `Button.icon`과 같은 장식 아이콘 계약이다 — 아이콘 있는 검색 입력창을 화면에서 `relative`+`absolute`로 다시 조립하지 말 것)
- `Combobox` → `Field` + `Input`의 `inputVariants`  (**검색형 선택 UI를 새로 만들지 말 것** — 라벨/힌트/에러 껍데기와 리스트박스 ARIA·키보드 처리가 이미 여기 있다)
- `BookSelectField` → `Combobox` + `lib/api/books`(`searchBooks`)  (**도서 선택 UI가 필요하면 이걸 쓸 것** — 디바운스·요청 취소·경합 처리를 손으로 하지 않는다)
- `CopyRegisterSection` → `CopyRegisterForm` + `CopyListCard`  (**페이지에서 폼·목록을 직접 배치하지 말 것** — refreshToken 배선을 손으로 하지 않는다. 등록 성공용 `refreshToken`(부모 소유, 1페이지 리셋)과 상태 변경용 `fetchToken`(카드 내부, 페이지 유지)은 **의도적으로 분리**돼 있다 — 하나로 합치면 분실·폐기할 때마다 목록이 1페이지로 튄다)
- `CopyRegisterForm` → `Card` + `BookSelectField` + `Input` + `StatusBadge` + `Button` + `Toast` + `lib/api/bookitems`  (등록 성공 시 `onCreated(bookItem)` 콜백 — `BookRegisterForm`과 동일 관례)
- `CopyListCard` → `Card` + `Input`×2 + `Badge`(tone="copy") + `DataTable` + `StatusBadge` + `Button` + `ListErrorState` + `Toast` + `lib/api/bookitems`(`searchBookItems`/`changeBookItemStatus`) + `lib/use-debounced-value`  (상태 변경 후 낙관적으로 배지를 바꾸지 않고 재조회한다. 관리번호·도서명 검색은 **서버 AND 조건**이라 통합 검색창 하나로 OR 검색할 수 없어 입력을 둘로 나눴다. ON_LOAN 차단은 UI 정책이다 — 서버는 거부하지 않는다)
- `BookListCard` → `Card` + `Badge` + `Input`(`leadingIcon`) + `IconSearch` + `DataTable` + `ListErrorState` + `lib/api/books`(`searchBooks`) + `lib/use-debounced-value`  (검색어를 **자체 소유**한다 — 부모 `BookRegisterSection`은 `refreshToken`만 소유하므로 등록 성공 시 검색어가 유지되는 데 코드가 필요 없다. 검색 헤더 행은 `CopyListCard`와 같은 인라인 `div`(`border-b border-line px-5 py-3.5`)다 — 두 벌이 텍스트로 동일해야 나중에 한 번에 뽑힌다. **세 번째 사용처가 생기면 검색 전용 래퍼(`CardSearchRow` 등)를 만들지 말고 `Card`의 하위 파트로 승격할 것** — 이 행의 본질은 "검색"이 아니라 "구분선 있는 Card 본문 섹션"이다)
- `LoanRegisterSection` → `LoanRegisterForm` + `LoanListCard`  (**페이지에서 폼·목록을 직접 배치하지 말 것** — refreshToken 배선을 손으로 하지 않는다)
- `LoanRegisterForm` → `Card` + `Input` + `Button` + `Toast` + `IconCalendar` + `lib/api/loans`  (관리번호는 plain `Input`이다 — 아래 검색형 선택 문단 참조)
- `LoanListCard` → `Card` + `DataTable` + `StatusBadge` + `lib/api/loans`  (연체 배지는 서버가 내려준 `overdue`를 그대로 쓴다 — 프론트에서 날짜를 재계산하지 않는다)
- `ReturnListCard` → `Card` + `Input` + `DataTable` + `StatusBadge` + `Button` + `Toast` + `lib/api/loans`(`returnLoan`)  (반납 처리 후 낙관적으로 행을 바꾸지 않고 재조회한다 — `LoanListCard`와 동일 원칙. 관리번호 검색은 백엔드 `/loans`가 지원하지 않아 ON_LOAN 전체를 받아 클라이언트에서 필터링한다)
- `LoanHistoryCard` → `Card` + `Input` + `Button` + `Badge` + `DataTable` + `StatusBadge` + `lib/api/loans` + `lib/use-debounced-value`  (상태 필터는 네이티브 `<select>` + `Input`의 `inputVariants`다 — **`ui/select.tsx`를 새로 만들지 말 것**. 코드베이스 유일한 select라 1회용으로 두었고, 두 번째 사용처가 생기면 그때 프리미티브로 승격한다. 옵션 4종(전체/대출중/연체/반납완료)은 **전부 서버 필터**(`status` 파라미터)다 — 연체를 클라이언트에서 다시 걸러내지 않는다. 반납일 빈 값 `—` 표기도 이 카드의 `renderCell` 1회용이다)
- `LoanListCard` / `LoanHistoryCard` / `RecentLoansCard` → `library/loan-table.ts`(`LOAN_COLUMN_DEFS`, `LOAN_COLUMNS`, `LOAN_HISTORY_COLUMNS`, `DASHBOARD_LOAN_COLUMNS`, `toLoanBadgeStatus`)  (**대출 표의 컬럼·상태 매핑을 화면에서 다시 정의하지 말 것** — 컬럼 폭과 배지 라벨이 화면마다 갈라진다. **행 타입과 무관하게** 컬럼셋은 전부 이 파일이 소유한다. 컬럼셋이 셋인 이유는 화면별 취향이 아니라 **집합이 다르기 때문**이다 — 대출 현황(`LOAN_COLUMNS`, 7컬럼)은 `status=ON_LOAN` 고정이라 `returnedAt`이 구조적으로 항상 null이라 반납일 컬럼이 없고, 대출 내역(`LOAN_HISTORY_COLUMNS`, 8컬럼, `#21`)은 반납 완료 건이 섞여 반납일이 있으며, 대시보드 최근 활동(`DASHBOARD_LOAN_COLUMNS`, 5컬럼, `#37`)은 2단 패널의 좁은 폭 때문에 관리번호·반납예정일·반납일을 뺐다. `#45`에서 이 컬럼셋만 행 타입이 `LoanActivity`가 됐다(대여일 컬럼 → 활동 시각 컬럼, `status` 헤더 '상태' → '활동'). 행이 대출 건이 아니라 대출/반납 이벤트라서다. 갈라지는 두 컬럼은 `ACTIVITY_COLUMN_DEFS`에 **모아서 가둬** 두었다 — `loanColumns()`에 라벨 오버라이드 인자를 추가하지 말 것(`#37`이 없앤 '표마다 라벨이 갈라지는' 경로다). `LoanActivity` 전용 컬럼셋이 둘째로 생기면 그때 `loanColumns()`를 행 타입으로 제네릭화한다. **`#37`에서 셋째 컬럼셋이 생기면서 파일이 예고했던 대로 "공통 정의(`LOAN_COLUMN_DEFS`) + 폭 주입(`loanColumns()`)"으로 리팩터했다** — 이제 `label`/`secondary`/`nowrap`은 한 곳에만 있어 표마다 갈라지는 것이 구조적으로 불가능하다. 배열마다 다른 것은 폭과 멤버십뿐이니, 넷째 컬럼셋이 필요하면 **배열을 복제하지 말고 `loanColumns({...})`를 한 줄 더 부른다**. `ReturnListCard`(액션 컬럼)는 배지 매핑만 공유하고 컬럼은 화면 파일에 둔다)
- `RecentLoansCard` / `OverdueListCard` → `library/dashboard-section.tsx`  (**페이지에서 두 카드를 직접 배치하지 말 것** — 두 카드는 `/dashboard/summary` **호출 하나**를 나눠 쓴다. 카드가 각자 조회하면 같은 응답을 두 번 받고 집계 기준일도 갈라진다. 그래서 이 둘은 다른 목록 카드(`LoanListCard` 등)와 달리 **조회를 소유하지 않고 `rows`를 주입받는다**. 로딩·에러도 카드가 아니라 섹션 단위다 — 출처가 요청 하나라 실패도 하나이고, 카드마다 `ListErrorState`를 두면 같은 문구가 두 번 뜬다)
- `RecentLoansCard`는 `LoanListCard`와 합치지 않는다 — 저쪽은 `status=ON_LOAN` 고정 + 서버 페이지네이션 + 조회 자체 소유이고, 이쪽은 상태 무필터 + 페이지네이션 없음 + 데이터 주입이다. 계약이 정반대라 prop으로 이으면 축이 셋 는다(`LoanHistoryCard`가 `LoanListCard`와의 통합을 거부한 것과 같은 상황)
- `OverdueListCard` → `Card` + `Badge`(solid/danger) + `DdayCard`  (`DdayCard` 주석이 "리스트 래핑은 소비 화면 책임"이라 명시한 그 소비처다 — `<ul>/<li>`와 `meta` 문자열 조합을 여기가 소유한다. 헤더 배지는 `rows.length`가 아니라 **`totalCount`(연체 전체 건수)**다 — 목록은 `OVERDUE_LIMIT`으로 잘려 있어 길이를 쓰면 배지가 거짓말한다. 서버 `overdueDays`는 경과일(양수)이고 `DdayCard`는 남은 일수를 받으므로 **부호를 뒤집어 넘긴다**)
- `DashboardSection` → `StatCard`×4 + `RecentLoansCard` + `OverdueListCard` + `ListErrorState` + `lib/api/dashboard`  (KPI 그리드는 **의도적으로 인라인**이다 — 사용처가 1곳뿐이라 `DashboardStatsGrid`를 뽑으면 "2회 반복이면 추출" 위반이다. 두 패널을 `lg:grid-cols-3` + `lg:col-span-2`로 놓아 디자인의 2:1을 임의값 없이 만들고, **grid의 기본 stretch가 좌우 카드 높이를 자동으로 맞춘다** — 연체 노출 개수 `OVERDUE_LIMIT`은 좌측 10행 표 높이(≈610px)에 맞춰 계산한 값이지만 폰트 렌더 오차는 이 stretch가 흡수한다)
- `BookSearchSection` → `BookSearchResultCard` + `BookCopiesCard` + `Card` + `Input`(`leadingIcon`) + `IconSearch` + `Button` + `lib/korean-particle`  (**페이지에서 검색바·두 카드를 직접 배치하지 말 것** — `search`/`selected` 배선을 손으로 하지 않는다. 검색어가 바뀌면 선택이 무효가 되는 규칙이 여기 한 곳에만 있다. 선택 상태는 `{ book, auto }`다 — 행 클릭은 `auto: false`, `onAutoSelect`는 함수형 업데이트로 **사용자 선택(`auto: false`)을 덮지 않고** 이전 자동 선택만 교체한다. 검색어 갱신은 전부 `applySearch(term)`를 지난다 — **`setSearch`와 `setSelected(null)`을 호출부에서 짝지어 쓰지 말 것**(입력·초기화·오타 교정 재검색 3경로가 공유한다). 좌우 카드를 하나로 합치지 않는 이유는 각자 독립된 비동기 작업을 갖기 때문이다 — `LoanHistoryCard`가 `LoanListCard`와의 통합을 거부한 것과 같은 상황. 오타 교정 제안 배너(`#29`, `#43`, `#49`)는 검색바 카드 안, 입력 행 바로 아래에 이 섹션이 렌더한다(디자인 배치) — 구분선을 넣지 않는다. 배너의 파생 데이터(`SuggestionInfo`)는 `BookSearchResultCard`가 소유하고 `onSuggestionChange`로 올려준다 — **섹션이 `suggestions`/`total`을 직접 계산하지 말 것**, 재검색 실행은 `applySearch`를 그대로 재사용한다. 서버 후보는 최대 3개이며 후보마다 재검색 버튼을 따로 그리고, 받침이 후보마다 달라 조사(`withEuro`)도 버튼별로 계산한다)
- `BookSearchResultCard` → `Card` + `Badge` + `DataTable` + `ListErrorState` + `lib/api/books`(`searchBooks`) + `lib/use-debounced-value`  (선택 상태는 소유하지 않는다 — `selectedId`를 받아 강조만 한다. 페이지를 넘겨도 선택은 유지된다. 자동 선택은 `searchBooks` 응답 도착 시점에 **1페이지 && 검색어 있음 && 결과 있음 && 최신 입력(트림)이 요청 검색어와 같음**이면 첫 행을 `onAutoSelect`로 올린다 — **`selectedId`/`rows`를 보는 이펙트로 파생하지 말 것**(타이핑 중 이전 검색어의 첫 행이 재선택된다). 빈 검색어(전체 목록)는 자동 선택하지 않으며, 덮을지 여부는 부모가 정한다. `BookListCard`와 겸용하지 않는다 — 저쪽은 행 클릭·선택이 없고 검색어를 자기가 소유하며 리셋 트리거를 부모가 `refreshToken`으로 소유해 계약이 충돌한다. 오타 교정 제안(`#29`, `#43`, `#49`)은 이 카드가 계산만 하고 **렌더는 하지 않는다** — 배너가 검색바 카드 소속(디자인 배치)이라 이 `noPadding` 결과 카드에 자리가 없다. 대신 `SuggestionInfo`(`{query, suggestions, hasResults}`)를 `onSuggestionChange` 이펙트로 부모 `BookSearchSection`에 올린다. **트리거는 `suggestions`가 비어 있지 않은지 하나뿐이다**(빈 배열이면 `null`을 올린다) — 서버가 "결과 건수와 무관하게" 내려주므로(`exactSubstringHits == 0`이면 결과가 있어도 옴) `total`/`pagination.totalElements`로 다시 게이팅하지 않는다(`#43`). `DataTable`의 `emptyText`는 항상 고정 문구다 — 제안 유무로 갈라 쓰지 않는다. 에러 응답 시에는 `result`가 직전 성공 값을 들고 있어 `suggestions`를 `!error`로 숨긴다)
- `BookCopiesCard` → `Card` + `Badge`(tone="copy") + `DataTable` + `StatusBadge` + `ListErrorState` + `lib/api/books`(`getBook`)  (제목·저자·출판사는 좌측에서 넘어온 `BookListItem`에서 그린다 — `getBook()`은 `bookItems` 하나만을 위한 호출이라 스피너·스켈레톤이 필요 없다. 404는 재시도 버튼 없이 `ListErrorState`만 띄운다. 상세를 캐시하지 않는다 — 소장본 상태는 다른 사용자의 대출·반납으로 수시로 바뀐다. ISBN은 표시하지 않는다 — 도서 등록 화면이 더 이상 ISBN을 수집하지 않는다)
- `BookListCard` / `BookSearchResultCard` / `BookCopiesCard` / `CopyListCard` → `library/book-table.ts`(`BOOK_COLUMNS`, `BOOK_ITEM_COLUMNS`, `BOOK_ITEM_SEARCH_COLUMNS`, `EMPTY_CELL`, `toBookItemBadgeStatus`)  (행 타입이 `BookListItem`/`BookItemSummary`/`BookItemSearchRow`인 표의 컬럼은 전부 이 파일이 소유한다. **도서·소장본 표의 컬럼과 셀 포맷을 화면에서 다시 정의하지 말 것** — `loan-table.ts`와 같은 이유다. 소장본 표에 대출자·반납예정일 컬럼을 만들지 말 것 — 백엔드 `GET /books/{id}`에 필드 자체가 없다. 도서 목록과 도서 검색 결과는 행 타입도 컬럼 집합도 같으므로 `BOOK_COLUMNS` 배열을 **하나만** 둔다 — 두 화면 모두 ISBN을 노출하지 않는다(도서 등록 화면이 더 이상 ISBN을 수집하지 않아 목록에 보여줄 근거가 없다). ISBN이 어디에도 노출되지 않으므로 `formatIsbn`은 삭제했다)
- `BookSelectField` / `LoanHistoryCard` / `BookSearchResultCard` / `CopyListCard` / `BookListCard` → `lib/use-debounced-value.ts`  (**디바운스를 컴포넌트에 인라인하지 말 것** — 지연 시간이 화면마다 갈라진다)
- `DataTable` → `Pagination`  (**서버 페이지네이션이 필요하면 `serverPagination` prop을 쓸 것** — `Pagination`을 표 아래에 따로 붙이지 않는다)
- `DataTable`의 `emptyText`는 `ReactNode`다(`#29`) — 빈 상태에 액션이 필요하면 **표 밖에 별도 블록을 만들지 말고 이 prop에 노드를 넘긴다**. 다만 정렬·기본 색·여백은 빈 셀 td가 이미 소유하므로 노드 쪽에서 `text-center`/`text-fg-muted`를 다시 붙이지 말 것. 조회 **실패**는 여전히 `ListErrorState`다 — 빈 결과와 에러를 이 prop으로 뭉치지 말 것
- `LoanHistoryCard` / `RecentLoansCard` → `ui/EmptyCell`  (**표 셀의 "값 없음" 표기를 화면마다 다시 마크업하지 말 것** — 기호·색·sr-only 유무가 표마다 갈라진다. 사유는 `label`로 넘긴다: 미반납(`returnedAt`), 반납 완료로 파기됨(`borrowerName`). `book-table.ts`의 `EMPTY_CELL = "—"`와 합치지 않는다 — 저건 포맷 함수가 돌려주는 **문자열**이고 이건 노드다)
- `ImportResultBanner` → `Card` + `IconBox`(shape="card") + `IconCheck`/`IconClose`  (**성공/오류 결과 배너를 화면에서 다시 마크업하지 말 것** — 구조가 같고 tone만 다르다. 결과 화면이 늘면 이 컴포넌트에 tone을 추가한다)
- `ExcelFileDropzone` → `Button`  (파일 피커·drag&drop·파일 크기 표기를 화면에서 다시 만들지 말 것. **확장자·용량 사전 검증을 넣지 않는다** — 서버가 `INVALID_FILE_TYPE`/`FILE_TOO_LARGE`로 판정하고 결과는 Toast로 나온다)
- `ExcelImportSection` → `ExcelImportForm` + `ExcelImportResult` + `Toast` + `lib/api/excel`(`importExcel`)  (**페이지에서 폼·결과를 직접 배치하지 말 것.** 단, 이건 `CopyRegisterSection`류의 "폼+목록 refreshToken" 패턴이 **아니다** — 목록이 없고 폼↔결과가 배타 전환된다. `refreshToken`을 배선하지 말 것. `phase` enum도 두지 않는다 — `file`/`uploading`/`result` 3개 상태에서 전부 파생된다)
- `ExcelImportResult` → `ImportResultBanner` + `StatCard`×4 + `Card` + `DataTable` + `Button` + `buttonVariants`+`next/link` + `library/excel-table`  (201/409 유니온을 판별하는 지식이 여기 한 곳에만 있다. 성공/오류를 두 컴포넌트로 쪼개지 말 것 — 배너를 공유하고 리셋 계약이 같다. "도서 검색으로 이동"은 `<Link className={buttonVariants({...})}>`다 — `Button`은 `<button>`이라 링크가 안 되고, `LinkButton`을 새로 만들지 않는다. 결과 블록은 나중에 DOM에 삽입돼 live region으로 낭독되지 않으므로 마운트 시 배너 제목(`tabIndex={-1}`)으로 포커스를 옮긴다)
- `DataExportSection` → `ExportSheetSelectCard` + `ExportOptionsCard` + `Toast` + `library/export-options` + `lib/api/excel`(`exportExcel`) + `lib/download`  (`<form>`은 이 섹션이 소유하고 카드 2개를 함께 감싼다 — `ExportOptionsCard` 안에 폼을 만들면 중첩 폼이 된다)
- `ExportOptionsCard` → `Card` + `Input`(type="date")×2 + `Toggle`×2 + `Button`  (날짜 `Input`에 `aria-describedby`를 직접 넘기지 말 것 — `Input` 내부 `useFieldIds` 배선을 스프레드가 덮어써 `error` 연결이 끊긴다)
- `ExportSheetSelectCard` → `Card` + `CheckCard`×3 + `library/export-options`(`EXPORT_SHEET_OPTIONS`)  (시트 컬럼 미리보기는 **백엔드 실제 컬럼**이다 — 디자인 목업 컬럼을 되살리지 말 것. 시트별 행 수는 카운트 API가 없어 표시하지 않는다)
- `ExcelImportResult` → `library/excel-table.ts`(`IMPORT_WARNING_COLUMNS`, `IMPORT_ERROR_COLUMNS`)  (**엑셀 결과 표의 컬럼을 화면에서 다시 정의하지 말 것** — `book-table.ts`/`loan-table.ts`와 같은 이유. 배열이 둘인 것은 집합이 달라서다(경고 표엔 `errorField`가 없다). `code` 컬럼은 두 표 모두 없다 — 사용자 문구는 `message`다. 빈 셀 `—`는 `book-table.ts`의 `EMPTY_CELL`을 import한다)
- `lib/api/excel.ts` → `lib/api/client.ts`(`buildUrl`/`isAbortError`/`networkError`/`toApiError`)  (**이 도메인만 `apiFetch`를 쓰지 않는다** — 등록은 multipart, 내보내기는 Blob이라 JSON 전용 계약에 맞지 않는다. 그래도 에러 정규화는 공용 헬퍼를 재사용해 다른 도메인과 같은 `ApiError`를 던진다. `excel.ts`에서 `ApiError`를 손으로 조립하지 말 것. 409는 **정상 반환**이므로 `toApiError`에 태우지 말 것 — 바디가 유실된다)
- `BookListCard` / `LoanListCard` / `ReturnListCard` / `LoanHistoryCard` / `BookSearchResultCard` / `BookCopiesCard` / `CopyListCard` / `DashboardSection` → `ui/ListErrorState`
  (**목록 조회 실패 UI를 카드마다 다시 마크업하지 말 것** — 문구·여백·재시도 버튼이 화면마다 갈라진다. 조회 실패는 전부 여기다 — `Toast`는 쓰기(mutation) 결과 전용이다. 재시도해도 결과가 같은 실패(404 등)는 `onRetry`를 생략해 버튼 없이 렌더한다)

`Input`의 `leadingIcon`은 **장식 전용**이다(`aria-hidden` + `pointer-events-none`). 클릭 가능한 아이콘(지우기 버튼 등)이 필요해지면 이 prop에 버튼을 넣지 말고 그때 별도 축을 설계한다. `inputVariants`의 base는 좌측 패딩을 갖지 않는다 — `hasLeadingIcon` 축이 소유한다(cva가 클래스를 단순 연결하므로 `px-*`와 `pl-*`을 함께 두면 승패가 CSS 소스 순서에 걸린다).

`ui/Combobox`는 도메인을 모르는 검색-선택 프리미티브다. 새 검색 필드가 필요하면 `ui/`에 두 번째 콤보박스를 만들지 말고, `library/`에 `BookSelectField`처럼 API 배선만 하는 얇은 래퍼를 추가한다. **단, 검색 엔드포인트가 있을 때만이다** — `/loans/new`의 관리번호는 plain `Input` + 서버 에러 코드(`BOOK_ITEM_NOT_FOUND`/`BOOK_ITEM_NOT_AVAILABLE`) 필드 에러로 처리한다(`#11`) — 당시 백엔드에 소장본 검색 API가 없었기 때문이다. `#25`에서 `searchBookItems`(`GET /bookitems`)가 생겼으므로 이제는 소장본 콤보박스가 **기술적으로 가능하다**. 다만 대출 등록 UX 변경은 별도 결정 사항이라 `#11` 구현은 그대로 둔다 — 바꾸려면 이슈를 따로 연다. 대출자·부서도 "회원" 도메인이 없어 자유 텍스트다.

페이지 좌우/상하 여백은 `src/app/layout.tsx`의 `<main>`이 소유한다. 페이지·컴포넌트에서 `px-page-x py-page-y`를 다시 쓰지 않는다.

백엔드 호출은 `src/lib/api/`(`client.ts` 공통 + 도메인별 파일)를 통해서만 한다. 컴포넌트에서 `fetch`를 직접 부르지 않는다. 에러는 `ApiError`로 정규화되며 사용자 노출 문구는 `error.detail`이다. 목록 응답의 `pagination` 봉투 타입(`PaginationMeta`)도 도메인 공통이라 `client.ts`가 소유한다 — 도메인 파일에 복제하지 않는다. 검색 파라미터 타입과 행 타입은 서버가 별개 enum이면 프론트도 별개로 둔다 — `lib/api/loans.ts`의 `LoanSearchStatus`(3값: 검색 필터, `OVERDUE` 포함)와 `LoanStatus`(2값: 행의 도메인 상태)를 섞지 않는다. 에러 코드 상수는 도메인 파일 **한 곳**이 소유한다 — `BOOK_ITEM_NOT_FOUND_CODE`는 `bookitems.ts`가 소유하고 `loans.ts`가 기존 임포트 경로 유지를 위해 재수출한다(`#25`). 두 벌로 늘리지 말 것. 같은 규칙으로 `OverdueLoanSummary`(연체 행 타입)는 **대출 도메인**인 `loans.ts`가 소유하고 `dashboard.ts`가 임포트한다 — 화면이 쓰는 곳으로 타입을 옮기지 말 것(`#37`).

`lib/api/dashboard.ts`는 백엔드의 **화면 전용 집계 엔드포인트**(`GET /dashboard/summary`)를 감싼다. 대시보드를 그리려고 `/books`·`/bookitems`·`/loans`를 각각 긁지 말 것 — 호출이 4~5개로 늘고 집계 기준일이 호출마다 갈라진다(서버는 `LocalDate.now()` 한 번으로 전부 계산한다). 표시 건수(`RECENT_ACTIVITY_LIMIT`/`OVERDUE_LIMIT`)는 **모듈 상수로 고정한다** — 서버가 limit 조합을 캐시 키로 쓰므로 화면에서 흔들면 캐시가 조합마다 갈라진다.

`LoanSummary.borrowerName`은 **nullable이다**(`#37`에서 서버 스키마에 맞춰 교정). 반납 완료 건은 개인정보 파기로 서버가 null을 내려준다 — `status=ON_LOAN`으로 좁힌 목록에서는 항상 값이 있지만, 상태 필터가 없는 목록(대출 내역·대시보드 최근 활동)에는 실제로 섞인다. 표에서 그냥 렌더하면 빈 셀이 되므로 `ui/EmptyCell`을 쓴다.

`apiFetch`를 쓸 수 없는 엔드포인트(multipart 요청·Blob 응답)는 `client.ts`가 export하는 `buildUrl`/`isAbortError`/`networkError`/`toApiError`로 **에러 정규화만 공유**한다(`lib/api/excel.ts`, `#27`). 새 fetch 함수를 만들 때 `ApiError`를 직접 `new` 하지 말 것 — 사용자 노출 문구(`detail`)와 네트워크 실패 문구가 도메인마다 갈라진다.

파생 로직은 `src/lib/dday.ts`(`getUrgency` / `formatDday`)에 있다. `DdayCard`가 이 함수를 사용한다. 한국어 조사 선택은 `src/lib/korean-particle.ts`(`hasBatchim` / `withEun` / `withEuro`)에 있다. `BookSearchSection`이 사용한다. **조사 분기를 컴포넌트에 인라인하지 말 것** — 받침 판정 규칙이 화면마다 갈라진다. 상대 시간 표기는 `src/lib/relative-time.ts`(`formatRelativeTime`)에 있다. `RecentLoansCard`가 사용한다. **"N분 전" 계산을 셀에 인라인하지 말 것** — 경계값(어제/주/4주)이 화면마다 갈라진다.

라우트 경로는 `src/components/library/nav-items.tsx`의 `LIBRARY_NAV_ITEMS[].href`와 `ADMIN_TAB_ITEMS[].href`가 함께 단일 진실 원천이다(`#31`). 새 화면을 추가하면 둘 중 맞는 배열에 항목을 넣고 `src/app/**`에 대응 라우트를 만든다 — 관리자 탭 데이터를 별도 파일로 분리하지 말 것(매칭 규칙 `resolveActiveNavId`와 href 값은 함께 바뀐다). `/admin` 자체는 화면이 아니라 허브라 `src/app/admin/page.tsx`가 `ADMIN_DEFAULT_TAB_HREF`(= `ADMIN_TAB_ITEMS[0].href`)로 리다이렉트한다 — 대상을 하드코딩하거나 `next.config.ts`의 `redirects()`로 옮기지 말 것.

Blob 다운로드는 `src/lib/download.ts`의 `downloadBlob(blob, filename)`이 담당한다. 파일명은 **항상 서버의 `Content-Disposition`에서 온다**(`exportExcel()` 반환값) — 클라이언트에서 조합한 이름으로 저장하지 말 것. `export-options.ts`의 `estimateExportFileName()`은 화면에 보여주는 "예상 파일명" 표시용이며 다운로드에 쓰지 않는다. 이 값은 프리렌더된 HTML에 빌드 시점 날짜가 박히지 않도록 `DataExportSection`이 `useSyncExternalStore`(server snapshot = 빈 문자열)로 **클라이언트에서만** 계산한다 — 렌더 중에 직접 부르면 하이드레이션이 어긋난다.

`PagePlaceholder`는 `#27`에서 `/admin/excel-import`·`/admin/data-export`가 실제 구현으로 교체되며 사용처가 0이 돼(`#37`이 대시보드도 이미 `DashboardSection`으로 교체) 삭제했다. 앞으로 화면 구현 전 스캐폴딩이 다시 필요해지면 이 컴포넌트를 되살리지 말고 그 시점 요구에 맞춰 새로 설계할 것 — 빈 화면 규약이 바뀌었을 수 있다.
