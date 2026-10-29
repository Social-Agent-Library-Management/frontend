# 디자인 ↔ 코드 차이 리포트 (2026-10-29)

- 디자인: Claude Design `도서 관리 시스템 Design System` (307f4357-35a5-463d-9674-9b2fefff09fa)
- 코드: 이 레포 `main` `b6d23aa` (#51까지 포함. 작업 당시 로컬 커밋 56b55c8과 코드 동일)
- 기준: **코드가 정답** (배포본)

범례: 🔴 화면에 보이는 차이 · 🟡 API·이름만 다름(겉모습 동일) · 🟢 코드에만 있음(디자인에 추가 필요) · ⚪ 디자인에만 있음

---

## 1. Brand
| | 항목 | 디자인 | 코드 |
|---|---|---|---|
| ✅ | 로고 박스 40×40, radius 10, 흰 줄 아이콘, "도서 관리 시스템" 17px/700 | 동일 | 동일 |

## 2. Colors — 값은 전부 동일, 이름이 다름
| | 디자인 토큰 | 코드 토큰 (Tailwind 유틸) |
|---|---|---|
| 🟡 | `--color-bg` | `--color-canvas` (`bg-canvas`) |
| 🟡 | `--color-surface-secondary` | `--color-surface-muted` |
| 🟡 | `--color-border` / `-strong` | `--color-line` / `-strong` |
| 🟡 | `--color-text-primary / secondary / placeholder / inverse` | `--color-fg / fg-muted / fg-subtle / fg-inverse` |
| 🟢 | (없음 — Button에 hex 하드코딩 `#D93025`, `#28A745`) | `--color-danger-hover`, `--color-success-hover` |

## 3. Type
| | 항목 | 디자인 | 코드 |
|---|---|---|---|
| 🟡 | 크기 토큰 이름 | `--font-size-xs…3xl` | `--text-xs…3xl` (값 동일) |
| 🟢 | 10px | Badge 내부 하드코딩 | `--text-2xs` 토큰 |
| 🟡 | 굵기 400 | `--font-weight-regular` | `--font-weight-normal` |
| 🟢 | 행간 | tight 1.2 / base 1.5 / relaxed 1.65 | + `snug 1.3`, `cozy 1.4` (실사용값 토큰화) |
| 🟡 | 자간 | `--letter-spacing-*` | `--tracking-*` |
| 🟡 | 폰트 | Google Fonts @import | `next/font` Noto Sans KR (패밀리 동일) |

## 4. Spacing · Radius · Shadow
| | 항목 | 디자인 | 코드 |
|---|---|---|---|
| 🟡 | 4px 그리드 `--space-1…16` | 정의 | Tailwind 기본 스케일 사용(값 동일) |
| ⚪ | `--space-card-padding`, `--space-section-gap`, `--space-input-y` | 정의 | 없음 |
| 🟡 | 레이아웃 상수 | `--space-sidebar-width` 등 | `--spacing-sidebar / header / nav-item / page-x / page-y / input-x` |
| 🟢 | `--radius-tile` 10px | 없음 | CheckCard·파일 행용 |
| 🟢 | `--shadow-focus-ring` | Input 내부 하드코딩 | 토큰 + 키보드 `focus-ring` 유틸(포커스 아웃라인) |

## 5. Components

### 기존 7개
| | 컴포넌트 | 차이 |
|---|---|---|
| 🟡 | **Badge** | 디자인은 `status` 하나로 처리. 코드는 **`Badge`(형태: `variant` soft·solid × `tone` 7종 × `size`) + `StatusBadge`(`status` 7종 → tone 매핑)** 로 분리. soft 겉모습은 동일, **solid 변형 신규** |
| 🔴 | **DdayCard** | D-day pill이 `Badge solid lg` 재사용 → 높이 26px·좌우 12px·min-width 52 (디자인: padding 5×14, 높이 약 23px). 미세 크기 차이 |
| 🟡 | **StatCard** | `iconBg`/`subColor`(임의 CSS 문자열) → `tone`/`subTone` 토큰 축 |
| 🟡 | **Card** | 제목 `span` → `h2/h3`(`titleAs`), `style` → `className`. 겉모습 동일 |
| 🟢 | **Input** | `leadingIcon`(좌측 아이콘) 추가. 라벨/힌트/에러 껍데기는 `Field`로 분리 |
| 🟢 | **DataTable** | `serverPagination`, `loading`/`loadingText`, `caption` 추가. 페이지네이션이 `Pagination` 컴포넌트로 분리(겉모습 동일) |
| 🟡 | **Sidebar** | 항목에 `href`(링크) 추가, 아이콘은 currentColor. `ADMIN_NAV_ITEMS` → `ADMIN_TAB_ITEMS`(desc·아이콘 없음, 탭 전용). 겉모습 동일 |

### 코드에만 있는 재사용 컴포넌트 (디자인 시스템 추가 후보)
| | 컴포넌트 | 용도 |
|---|---|---|
| 🟢 | `Field` | 라벨·힌트·에러 공용 껍데기 |
| 🟢 | `Combobox` | 검색형 선택 (도서 선택) |
| 🟢 | `Pagination` | 표 하단 페이지 이동 |
| 🟢 | `PageHeader` | 페이지 제목 + 설명 + 우측 액션 |
| 🟢 | `Toast` | success·danger 알림 |
| 🟢 | `Toggle` | on/off 스위치 |
| 🟢 | `CheckCard` | 체크 가능한 선택 타일 |
| 🟢 | `IconBox` | 아이콘 컨테이너 (circle·rounded·card × sm·md·lg) |
| 🟢 | `ListErrorState` | 목록 로딩 실패 + 재시도 |
| 🟢 | `EmptyCell` | 빈 셀 "-" 표기 |
| 🟢 | `AdminTabs` | 관리자 페이지 밑줄 탭 |
| 🟢 | `ImportResultBanner`, `ExcelFileDropzone` | 엑셀 일괄 등록 전용 |

(나머지 `*Section`/`*Form`/`*ListCard`는 API에 붙은 화면 조각이라 디자인 시스템이 아니라 Library Management 화면 쪽에서 반영)

## 6. Library Management (화면 프로토타입 `ui_kits/library/index.html`)
| | 화면 | 디자인 | 코드 (배포본) | 원인 커밋 |
|---|---|---|---|---|
| 🔴 | 도서 검색 · 오타 제안 | 제안 1개 배너 | **최대 3개 후보, 후보별 재검색 버튼** | #49 |
| 🔴 | 도서 검색 · 소장본 패널 | 행 클릭 전엔 비어 있음 | **검색 결과 1행을 자동 선택해 소장본 바로 표시** | #51 |
| 🔴 | 도서 검색 · 소장본 패널 메타 | ISBN 표시 | ISBN 제거 | #39 |
| 🔴 | 도서 검색 · 검색 범위 | 제목·저자·출판사·ISBN 필터 | 제목·저자만 (placeholder는 이미 일치) | #43 |
| 🔴 | 도서 검색 · 페이지 크기 | 10 | 20 | #39 |
| 🔴 | 관리자 탭 툴팁 | "ISBN 조회로 새 도서를 등록합니다." | ISBN 수집 안 함 | #39 |
| ✅ | 대시보드 · 최근 활동 | 상대시간(N분 전) 컬럼 | 동일 | #45 반영됨 |
| ✅ | 관리자 탭 구조 · 5개 탭 · /admin→첫 탭 | 동일 | 동일 | #31 반영됨 |
| ✅ | 연체 목록 화면 제거 | 제거됨 | 제거됨 | #21 반영됨 |
| ✅ | 소장본 검색 입력 위치 | 목록 카드 안 | 동일 | #25 |
| 🔴 | 관리자 · 도서 목록 검색 placeholder | "도서명, 저자 또는 출판사로 검색" | "도서명, 저자, 출판사 또는 ISBN으로 검색" | #33/#39 (코드 쪽이 ISBN 문구를 남김 — 확인 필요) |
| ⚪ | 내보내기 · 도서 시트 컬럼 | ISBN 포함 | ISBN 포함 (일치) | — |
| ⚪ | 로그인 화면 | 있음 | 코드에 없음 | — |
| ⚪ | 알림 설정 화면 | README에 언급 | 코드에 없음 | — |

## 7. 문서 (readme.md, ui_kits/library/README.md)
| | 항목 |
|---|---|
| 🔴 | `readme.md` Sources: "production codebase 없음, SVG가 유일한 원본" → 이제 배포 코드가 기준 |
| 🔴 | `readme.md` Badge: "Five statuses / never solid" → 7개 상태 + solid 변형(D-day pill) |
| 🔴 | `readme.md` 기능 목록에 CSV 업로드·알림 설정 → 실제는 엑셀 일괄 등록·내보내기, 알림 설정 없음 |
| 🔴 | `ui_kits/library/README.md` 화면 표에 `overdue`(삭제됨) 있고 도서 검색·엑셀·내보내기 없음 |

---

## 백업
- 위치: `.design-sync/backup/2026-10-29/`
- 포함: tokens 5개, styles.css, 컴포넌트 JSX 8개, core/display 카드, ui_kits index.html·README, readme.md
- 미포함(수정 직전에 해당 파일만 추가 백업 예정): `.d.ts`/`.prompt.md`, data·navigation 카드, guidelines 카드 8개, `_ds_bundle.js`(JSX 8개에서 그대로 재생성 가능)
- 건드리지 않을 파일(백업 불필요): `uploads/`, `assets/`, `scraps/`, `SKILL.md`, 기능명세·API명세 문서, thumbnail
