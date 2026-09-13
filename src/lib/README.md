# API·유틸 레이어 규약

API·유틸 레이어 규약은 **이 파일이 소유한다**. 컴포넌트 문서에 섞지 않는다.
결정의 경위는 커밋 본문이 소유한다.

> `src/components/README.md`에 남아 있는 같은 내용은 PR #28 머지 후 후속 이슈에서
> 제거한다(그 파일을 #28이 동시에 수정 중이라 지금 손대면 충돌한다).

## 호출 경로

백엔드 호출은 `src/lib/api/`(`client.ts` 공통 + 도메인별 파일)를 **통해서만** 한다.
컴포넌트에서 `fetch`를 직접 부르지 않는다.

- 에러는 `ApiError`로 정규화되고, 사용자 노출 문구는 `error.detail`이다.
- 목록 응답의 `pagination` 봉투 타입(`PaginationMeta`)은 도메인 공통이라 `client.ts`가 소유한다 — 도메인 파일에 복제하지 말 것.
- 에러 코드 상수는 도메인 파일 **한 곳**이 소유한다. `BOOK_ITEM_NOT_FOUND_CODE`는 `bookitems.ts`가 소유하고 `loans.ts`가 기존 임포트 경로 유지를 위해 재수출한다. 두 벌로 늘리지 말 것.
- 타입은 **쓰는 화면이 아니라 속한 도메인**에 둔다. `OverdueLoanSummary`와 `LoanActivity`는 `loans.ts`가 소유하고 `dashboard.ts`가 임포트한다.
- 서버가 별개 enum이면 프론트도 별개로 둔다 — `LoanSearchStatus`(3값, 검색 필터, `OVERDUE` 포함)와 `LoanStatus`(2값, 행의 도메인 상태)를 섞지 말 것.

## `apiFetch`를 쓸 수 없는 경우

multipart 요청·Blob 응답은 JSON 전용 계약에 맞지 않는다(`lib/api/excel.ts`).
이때도 `client.ts`가 export하는 `buildUrl` / `isAbortError` / `networkError` / `toApiError`로
**에러 정규화만 공유**한다.

- 새 fetch 함수에서 `ApiError`를 직접 `new` 하지 말 것 — 노출 문구와 네트워크 실패 문구가 도메인마다 갈라진다.
- 엑셀 일괄 등록의 409는 **정상 반환**이다 — `toApiError`에 태우면 바디가 유실된다.

## 집계 엔드포인트

`lib/api/dashboard.ts`는 화면 전용 집계 엔드포인트(`GET /dashboard/summary`)를 감싼다.

- 대시보드를 그리려고 `/books`·`/bookitems`·`/loans`를 각각 긁지 말 것 — 호출이 4~5개로 늘고 집계 기준일이 호출마다 갈라진다(서버는 `LocalDate.now()` 한 번으로 계산한다).
- 표시 건수(`RECENT_ACTIVITY_LIMIT` / `OVERDUE_LIMIT`)는 **모듈 상수로 고정**한다 — 서버가 limit 조합을 캐시 키로 쓰므로 화면에서 흔들면 캐시가 조합마다 갈라진다. 쿼리 키(`recentActivityLimit`)와 상수명을 함께 맞춘다 — 서버 `@Cacheable` 키가 **파라미터 이름**에 걸려 있어 키 철자가 틀리면 캐시가 조용히 갈라진다.

## nullable 필드

`LoanSummary.borrowerName`과 `LoanActivity.borrowerName`은 **nullable이다.** 반납 완료 건은 개인정보 파기로 서버가
null을 내려준다. `status=ON_LOAN`으로 좁힌 목록에는 항상 값이 있지만, 상태 필터가 없는
목록(대출 내역·대시보드 최근 활동)에는 실제로 섞인다. 표에서 그냥 렌더하면 빈 셀이
되므로 `ui/EmptyCell`을 쓴다.

## 파생 로직

| 모듈 | 함수 | 규칙 |
|---|---|---|
| `dday.ts` | `getUrgency` / `formatDday` | `DdayCard`가 사용 |
| `relative-time.ts` | `formatRelativeTime` | `RecentLoansCard`가 사용. "N분 전" 계산을 셀에 인라인하지 말 것 — 경계값이 화면마다 갈라진다 |
| `korean-particle.ts` | `hasBatchim` / `withEun` / `withEuro` | 조사 분기를 컴포넌트에 인라인하지 말 것 — 받침 판정이 화면마다 갈라진다 |
| `use-debounced-value.ts` | — | 디바운스를 컴포넌트에 인라인하지 말 것 — 지연 시간이 갈라진다 |
| `download.ts` | `downloadBlob(blob, filename)` | 파일명은 **항상 서버의 `Content-Disposition`**에서 온다. 클라이언트에서 조합한 이름으로 저장하지 말 것 |

`export-options.ts`의 `estimateExportFileName()`은 화면에 보여주는 "예상 파일명"
표시용이며 다운로드에 쓰지 않는다. 프리렌더된 HTML에 빌드 시점 날짜가 박히지 않도록
`DataExportSection`이 `useSyncExternalStore`(server snapshot = 빈 문자열)로
**클라이언트에서만** 계산한다 — 렌더 중에 직접 부르면 하이드레이션이 어긋난다.

## 라우팅

라우트 경로는 `src/components/library/nav-items.tsx`의 `LIBRARY_NAV_ITEMS[].href`와
`ADMIN_TAB_ITEMS[].href`가 함께 단일 진실 원천이다.

- 새 화면을 추가하면 둘 중 맞는 배열에 항목을 넣고 `src/app/**`에 대응 라우트를 만든다.
- 관리자 탭 데이터를 별도 파일로 분리하지 말 것 — 매칭 규칙(`resolveActiveNavId`)과 href 값은 함께 바뀐다.
- `/admin` 자체는 화면이 아니라 허브라 `src/app/admin/page.tsx`가 `ADMIN_DEFAULT_TAB_HREF`로 리다이렉트한다 — 대상을 하드코딩하거나 `next.config.ts`의 `redirects()`로 옮기지 말 것.

## 레이아웃

페이지 좌우/상하 여백은 `src/app/layout.tsx`의 `<main>`이 소유한다.
페이지·컴포넌트에서 `px-page-x py-page-y`를 다시 쓰지 않는다.
