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
| `Input` | `ui` | `invalid`(error prop에서 파생) × `hasLeadingIcon`(leadingIcon prop에서 파생) — 껍데기는 `Field`에 위임 | `#3` |
| `Field` | `ui` | 없음 (`label`/`hint`/`error`/`required`/`controlId` — hint↔error 배타 렌더) | `#9` |
| `Combobox` | `ui` | 옵션 `active`(true·false) × `selected`(true·false) (cva). 입력창은 `Input`의 `inputVariants` 재사용 | `#9` |
| `Card` | `ui` | `padding`(sm·md·lg), `noPadding`, `titleAs`(h2·h3) | `#3` |
| `Pagination` | `ui` | (내부 PageButton `state`: default·active) | `#3` |
| `DataTable` | `ui` | 없음 (제네릭 `T` — columns/rows 주도. 페이지네이션은 `pageSize`=클라이언트 / `serverPagination`=서버) | `#3` |
| `PagePlaceholder` | `ui` | 없음 (`title` / `description` prop) | `#5` |
| `PageHeader` | `ui` | 없음 (`title` / `description` / `actions` prop) | `#7` |
| `Toast` | `ui` | `tone`(success·danger) | `#7` |
| `ListErrorState` | `ui` | 없음 (`message` / `onRetry` / `retryLabel` prop) | `#17` |
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
| `ReturnListCard` | `library` | 없음 | `#13` |
| `LoanHistoryCard` | `library` | 없음 | `#15` |
| `BookSearchResultCard` | `library` | 없음 | `#23` |
| `BookCopiesCard` | `library` | 없음 | `#23` |
| `BookSearchSection` | `library` | 없음 | `#23` |
| `CopyListCard` | `library` | 없음 | `#25` |
| `CopyRegisterSection` | `library` | 없음 | `#25` |
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
- `Input` → `Field`  (`leadingIcon`은 `Button.icon`과 같은 장식 아이콘 계약이다 — 아이콘 있는 검색 입력창을 화면에서 `relative`+`absolute`로 다시 조립하지 말 것)
- `Combobox` → `Field` + `Input`의 `inputVariants`  (**검색형 선택 UI를 새로 만들지 말 것** — 라벨/힌트/에러 껍데기와 리스트박스 ARIA·키보드 처리가 이미 여기 있다)
- `BookSelectField` → `Combobox` + `lib/api/books`(`searchBooks`)  (**도서 선택 UI가 필요하면 이걸 쓸 것** — 디바운스·요청 취소·경합 처리를 손으로 하지 않는다)
- `CopyRegisterSection` → `CopyRegisterForm` + `CopyListCard`  (**페이지에서 폼·목록을 직접 배치하지 말 것** — refreshToken 배선을 손으로 하지 않는다. 등록 성공용 `refreshToken`(부모 소유, 1페이지 리셋)과 상태 변경용 `fetchToken`(카드 내부, 페이지 유지)은 **의도적으로 분리**돼 있다 — 하나로 합치면 분실·폐기할 때마다 목록이 1페이지로 튄다)
- `CopyRegisterForm` → `Card` + `BookSelectField` + `Input` + `StatusBadge` + `Button` + `Toast` + `lib/api/bookitems`  (등록 성공 시 `onCreated(bookItem)` 콜백 — `BookRegisterForm`과 동일 관례)
- `CopyListCard` → `Card` + `Input`×2 + `Badge`(tone="copy") + `DataTable` + `StatusBadge` + `Button` + `ListErrorState` + `Toast` + `lib/api/bookitems`(`searchBookItems`/`changeBookItemStatus`) + `lib/use-debounced-value`  (상태 변경 후 낙관적으로 배지를 바꾸지 않고 재조회한다. 관리번호·도서명 검색은 **서버 AND 조건**이라 통합 검색창 하나로 OR 검색할 수 없어 입력을 둘로 나눴다. ON_LOAN 차단은 UI 정책이다 — 서버는 거부하지 않는다)
- `BookListCard` → `Card` + `Badge` + `DataTable` + `lib/api/books`
- `LoanRegisterSection` → `LoanRegisterForm` + `LoanListCard`  (**페이지에서 폼·목록을 직접 배치하지 말 것** — refreshToken 배선을 손으로 하지 않는다)
- `LoanRegisterForm` → `Card` + `Input` + `Button` + `Toast` + `IconCalendar` + `lib/api/loans`  (관리번호는 plain `Input`이다 — 아래 검색형 선택 문단 참조)
- `LoanListCard` → `Card` + `DataTable` + `StatusBadge` + `lib/api/loans`  (연체 배지는 서버가 내려준 `overdue`를 그대로 쓴다 — 프론트에서 날짜를 재계산하지 않는다)
- `ReturnListCard` → `Card` + `Input` + `DataTable` + `StatusBadge` + `Button` + `Toast` + `lib/api/loans`(`returnLoan`)  (반납 처리 후 낙관적으로 행을 바꾸지 않고 재조회한다 — `LoanListCard`와 동일 원칙. 관리번호 검색은 백엔드 `/loans`가 지원하지 않아 ON_LOAN 전체를 받아 클라이언트에서 필터링한다)
- `LoanHistoryCard` → `Card` + `Input` + `Button` + `Badge` + `DataTable` + `StatusBadge` + `lib/api/loans` + `lib/use-debounced-value`  (상태 필터는 네이티브 `<select>` + `Input`의 `inputVariants`다 — **`ui/select.tsx`를 새로 만들지 말 것**. 코드베이스 유일한 select라 1회용으로 두었고, 두 번째 사용처가 생기면 그때 프리미티브로 승격한다. 옵션 4종(전체/대출중/연체/반납완료)은 **전부 서버 필터**(`status` 파라미터)다 — 연체를 클라이언트에서 다시 걸러내지 않는다. 반납일 빈 값 `—` 표기도 이 카드의 `renderCell` 1회용이다)
- `LoanListCard` / `LoanHistoryCard` → `library/loan-table.ts`(`LOAN_COLUMNS`, `LOAN_HISTORY_COLUMNS`, `toLoanBadgeStatus`)  (**대출 표의 컬럼·상태 매핑을 화면에서 다시 정의하지 말 것** — 컬럼 폭과 배지 라벨이 화면마다 갈라진다. 행 타입이 `LoanSummary`인 컬럼셋은 전부 이 파일이 소유한다. 컬럼셋이 둘인 이유는 화면별 취향이 아니라 **집합이 다르기 때문**이다 — 대출 현황(`LOAN_COLUMNS`, 7컬럼)은 `status=ON_LOAN` 고정이라 `returnedAt`이 구조적으로 항상 null이라 반납일 컬럼이 없고, 대출 내역(`LOAN_HISTORY_COLUMNS`, 8컬럼, `#21`)은 반납 완료 건이 섞여 반납일이 있다(디자인도 두 화면을 다르게 그린다). 두 배열의 `label`/`secondary`/`nowrap`은 같은 키에 대해 항상 일치해야 하고 다른 것은 폭뿐이다 — 한쪽만 고치지 말 것. `ReturnListCard`(액션 컬럼)는 배지 매핑만 공유하고 컬럼은 화면 파일에 둔다)
- `BookSearchSection` → `BookSearchResultCard` + `BookCopiesCard` + `Card` + `Input`(`leadingIcon`) + `IconSearch` + `Button`  (**페이지에서 검색바·두 카드를 직접 배치하지 말 것** — `search`/`selected` 배선을 손으로 하지 않는다. 검색어가 바뀌면 선택이 무효가 되는 규칙이 여기 한 곳에만 있다. 좌우 카드를 하나로 합치지 않는 이유는 각자 독립된 비동기 작업을 갖기 때문이다 — `LoanHistoryCard`가 `LoanListCard`와의 통합을 거부한 것과 같은 상황)
- `BookSearchResultCard` → `Card` + `Badge` + `DataTable` + `ListErrorState` + `lib/api/books`(`searchBooks`) + `lib/use-debounced-value`  (선택 상태는 소유하지 않는다 — `selectedId`를 받아 강조만 한다. 페이지를 넘겨도 선택은 유지된다. `BookListCard`와 겸용하지 않는다 — 저쪽은 검색어·행 클릭·선택이 없고 리셋 트리거를 부모가 `refreshToken`으로 소유해 계약이 충돌한다)
- `BookCopiesCard` → `Card` + `Badge`(tone="copy") + `DataTable` + `StatusBadge` + `ListErrorState` + `lib/api/books`(`getBook`)  (제목·저자·출판사·ISBN은 좌측에서 넘어온 `BookListItem`에서 그린다 — `getBook()`은 `bookItems` 하나만을 위한 호출이라 스피너·스켈레톤이 필요 없다. 404는 재시도 버튼 없이 `ListErrorState`만 띄운다. 상세를 캐시하지 않는다 — 소장본 상태는 다른 사용자의 대출·반납으로 수시로 바뀐다)
- `BookListCard` / `BookSearchResultCard` / `BookCopiesCard` / `CopyListCard` → `library/book-table.ts`(`BOOK_COLUMNS`, `BOOK_ITEM_COLUMNS`, `BOOK_ITEM_SEARCH_COLUMNS`, `EMPTY_CELL`, `formatIsbn`, `toBookItemBadgeStatus`)  (행 타입이 `BookListItem`/`BookItemSummary`/`BookItemSearchRow`인 표의 컬럼은 전부 이 파일이 소유한다. 컬럼셋이 셋인 이유는 화면이 셋이어서가 아니라 **행 타입과 집합이 다르기 때문**이다 — `BOOK_ITEM_COLUMNS`(2컬럼, `BookItemSummary`)에는 `bookTitle`이 없고 `BOOK_ITEM_SEARCH_COLUMNS`(4컬럼, `BookItemSearchRow`, `#25`)에는 있다. **도서·소장본 표의 컬럼과 셀 포맷을 화면에서 다시 정의하지 말 것** — `loan-table.ts`와 같은 이유다. 도서 목록과 도서 검색 결과는 행 타입도 컬럼 집합도 같으므로 배열을 **하나만** 둔다 — `loan-table.ts`가 배열을 둘 둔 것은 집합이 달라서지 화면이 달라서가 아니다. 소장본 표에 대출자·반납예정일 컬럼을 만들지 말 것 — 백엔드 `GET /books/{id}`에 필드 자체가 없다)
- `BookSelectField` / `LoanHistoryCard` / `BookSearchResultCard` / `CopyListCard` → `lib/use-debounced-value.ts`  (**디바운스를 컴포넌트에 인라인하지 말 것** — 지연 시간이 화면마다 갈라진다)
- `DataTable` → `Pagination`  (**서버 페이지네이션이 필요하면 `serverPagination` prop을 쓸 것** — `Pagination`을 표 아래에 따로 붙이지 않는다)
- `BookListCard` / `LoanListCard` / `ReturnListCard` / `LoanHistoryCard` / `BookSearchResultCard` / `BookCopiesCard` / `CopyListCard` → `ui/ListErrorState`
  (**목록 조회 실패 UI를 카드마다 다시 마크업하지 말 것** — 문구·여백·재시도 버튼이 화면마다 갈라진다. 조회 실패는 전부 여기다 — `Toast`는 쓰기(mutation) 결과 전용이다. 재시도해도 결과가 같은 실패(404 등)는 `onRetry`를 생략해 버튼 없이 렌더한다)

`Input`의 `leadingIcon`은 **장식 전용**이다(`aria-hidden` + `pointer-events-none`). 클릭 가능한 아이콘(지우기 버튼 등)이 필요해지면 이 prop에 버튼을 넣지 말고 그때 별도 축을 설계한다. `inputVariants`의 base는 좌측 패딩을 갖지 않는다 — `hasLeadingIcon` 축이 소유한다(cva가 클래스를 단순 연결하므로 `px-*`와 `pl-*`을 함께 두면 승패가 CSS 소스 순서에 걸린다).

`ui/Combobox`는 도메인을 모르는 검색-선택 프리미티브다. 새 검색 필드가 필요하면 `ui/`에 두 번째 콤보박스를 만들지 말고, `library/`에 `BookSelectField`처럼 API 배선만 하는 얇은 래퍼를 추가한다. **단, 검색 엔드포인트가 있을 때만이다** — `/loans/new`의 관리번호는 plain `Input` + 서버 에러 코드(`BOOK_ITEM_NOT_FOUND`/`BOOK_ITEM_NOT_AVAILABLE`) 필드 에러로 처리한다(`#11`) — 당시 백엔드에 소장본 검색 API가 없었기 때문이다. `#25`에서 `searchBookItems`(`GET /bookitems`)가 생겼으므로 이제는 소장본 콤보박스가 **기술적으로 가능하다**. 다만 대출 등록 UX 변경은 별도 결정 사항이라 `#11` 구현은 그대로 둔다 — 바꾸려면 이슈를 따로 연다. 대출자·부서도 "회원" 도메인이 없어 자유 텍스트다.

페이지 좌우/상하 여백은 `src/app/layout.tsx`의 `<main>`이 소유한다. 페이지·컴포넌트에서 `px-page-x py-page-y`를 다시 쓰지 않는다.

백엔드 호출은 `src/lib/api/`(`client.ts` 공통 + 도메인별 파일)를 통해서만 한다. 컴포넌트에서 `fetch`를 직접 부르지 않는다. 에러는 `ApiError`로 정규화되며 사용자 노출 문구는 `error.detail`이다. 목록 응답의 `pagination` 봉투 타입(`PaginationMeta`)도 도메인 공통이라 `client.ts`가 소유한다 — 도메인 파일에 복제하지 않는다. 검색 파라미터 타입과 행 타입은 서버가 별개 enum이면 프론트도 별개로 둔다 — `lib/api/loans.ts`의 `LoanSearchStatus`(3값: 검색 필터, `OVERDUE` 포함)와 `LoanStatus`(2값: 행의 도메인 상태)를 섞지 않는다. 에러 코드 상수는 도메인 파일 **한 곳**이 소유한다 — `BOOK_ITEM_NOT_FOUND_CODE`는 `bookitems.ts`가 소유하고 `loans.ts`가 기존 임포트 경로 유지를 위해 재수출한다(`#25`). 두 벌로 늘리지 말 것.

파생 로직은 `src/lib/dday.ts`(`getUrgency` / `formatDday`)에 있다. `DdayCard`가 이 함수를 사용한다.

라우트 경로는 `src/components/library/nav-items.tsx`의 `LIBRARY_NAV_ITEMS[].href`가 단일 진실 원천이다. 새 화면을 추가하면 여기에 항목을 넣고 `src/app/**`에 대응 라우트를 만든다.

`PagePlaceholder`는 화면 구현 전 스캐폴딩이다. 모든 화면이 구현되어 사용처가 0이 되면 삭제한다.
