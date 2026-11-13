# Design sync notes

코드(`src/`) → 디자인 시스템 아티팩트를 맞추는 작업의 규칙. 연결 정보는 `config.json`.

## 대상과 원칙

- 대상: Claude 아티팩트 `도서 관리 시스템 Design System` (`config.json`의 `artifactUrl`, 유형 "Design System").
- **배포 코드가 정답.** 디자인과 다르면 디자인을 코드에 맞춘다.
- 방식은 hand-mirror: 코드(`src/components`)를 보고 인라인 스타일 JSX로 옮긴 사본을 아티팩트 파일에 반영한다.
  `/design-sync` 변환기는 쓰지 않는다(디자인 시스템을 통째로 다시 만드는 도구라 구성·설명이 바뀐다).
- 토큰 이름은 디자인 쪽 이름 유지(값만 코드와 동일). 코드 이름 대응표는 아티팩트 `README.md`의 Sources 절.
- 로그인·알림 설정 화면은 코드에 없지만 디자인에 유지(2026-10-29 결정).
- 아티팩트에는 디자인만 둔다. 기획(기능명세)·API 명세는 노션에서 관리한다(2026-10-29 아티팩트에서 분리).

## 아티팩트 구조 (화면 페이지 ↔ 파일)

화면(사이드바·페이지)은 유형이 제공하고 바꿀 수 없다. 우리는 `project/` 아래 파일만 쓴다.

| 페이지 | 읽는 파일 |
|---|---|
| Overview | `README.md` + `components/Cover/preview.html` + 문서 섹션(`design-system.json`의 `docs.sections`, 현재 `ui_kits/library/README.md`) |
| Colors / Typography / Spacing | `tokens.json`의 `color` / `type` / `spacing`·`radius`·`shadow` |
| Type scale | `tokens.json`의 `typeScale` — 컴포넌트가 쓰는 `--font-size-*`·`--font-weight-*`·`--line-height-*`·`--letter-spacing-*` 변수 |
| Components | `components/<Name>/README.md`·`<Name>.d.ts`·`preview.html` + `components/bundle.js`(헤더 순서 = 표시 순서) |
| Assets | `assets/<그룹>/` (Logos · Screens · Scraps) |

- 사이드바 항목은 기본 6개 + `tokens.json`의 추가 토큰 묶음만 생긴다. `.md`는 Overview 안 섹션, 실행되는 HTML은 Components 카드로만 보인다.
  → 전체 프로토타입은 `components/FullSystem/preview.html`(group "Library Management", `page` 표시)이 `ui_kits/library/index.html`을 불러와 실행한다.
- 컴포넌트 소스: `components/src/<group>/<Name>.jsx`. 번들: `node .design-sync/build-bundle.cjs` (소스 → `components/bundle.js`, 표시 순서는 `config.json`의 `componentOrder`).
- 화면이 저장할 때 스스로 만드는 파일: `tokens.css`, `manifest.json`, `api/**`, README 끝의 "Consuming"·"Index" 절. 직접 쓰지 않는다
  (단, 이름 변경 등으로 낡게 된 `manifest.json`·`api/` 카드는 지워도 되고 다음 저장 때 다시 생긴다).
- `styles.css`는 프로토타입 전용 진입 스타일시트(웹폰트 + `tokens.css`). 컴포넌트 미리보기는 `tokens.css`·`components/bundle.css`를 자동으로 미리 로드한다.

## 동기화 절차

1. 기준 커밋(`config.json`의 `lastSyncedCommit`) 이후 바뀐 코드부터 본다: `git log <lastSyncedCommit>..main -- src/`
2. 아티팩트에서 바꿀 파일을 **먼저 읽는다**(Claude Code Artifact 도구 `read`, 여러 개는 `paths`). 사람이 화면에서 편집·저장했을 수 있으므로
   로컬 사본(`artifact/`, gitignore)보다 원격이 항상 우선이다. 읽은 최신본 위에서만 고친다.
3. 고친 파일을 로컬 폴더(`artifact/`)에 같은 경로로 두고 Artifact 도구 `publish`로 올린다(`url` = `artifactUrl`, `root` = `.design-sync/artifact`).
   - 바뀐 파일만 보낸다. 지울 파일은 `"project/<경로>": null`.
   - `.d.ts`·`.jsx`는 `{"from": "...", "contentType": "text/plain"}`로 보내야 한다(확장자만으로는 거부됨).
   - `design-system.json`(인덱스)은 키를 바꿀 때만, **마지막 호출에서**, 직전에 다시 읽은 최신본에 수정해서 보낸다. 바꿀 때마다 `lastChange`(by·at·via·note) 갱신.
   - 읽은 뒤 누가 바꿨으면 게시가 거부된다 → 그 파일을 다시 읽고 다시 적용.
4. 미리보기 검증: `artifact/project`를 `python3 -m http.server`로 띄우고, 미리보기 프레임처럼 `tokens.css`·`components/bundle.css`·React 18·`components/bundle.js`를
   먼저 로드한 페이지에 `preview.html` 내용을 넣어 headless Chrome `--screenshot`으로 확인(Chrome 확장은 localhost가 사이트 권한으로 막혀 있음).
5. 반영 후 파일 목록(`list` scope files)으로 크기를 대조하고 `config.json`의 `lastSync`·`lastSyncedCommit`을 갱신.

## 알아둘 제약

- 미리보기는 **폼 제출이 막힌 샌드박스**에서 실행된다. 프로토타입의 `<form onSubmit>`(로그인·등록)이 동작하도록 FullSystem 카드가
  제출 버튼 클릭/Enter를 받아 `submit` 이벤트를 직접 발생시키고, 막힌 localStorage는 메모리 저장소로 대체한다. 프로토타입 원본은 그대로 둔다.
- `.d.ts`의 `@startingPoint`, `_ds_bundle.js`, `_ds_needs_recompile`, `_ds_manifest.json`, 그룹 카드(`*.card.html`)는 단독 Claude Design 시절 형식이다. 아티팩트에서는 쓰지 않는다.
- 같은 값을 두 곳에 두지 않는다: 토큰 값은 `tokens.json`에만(스타일시트에 하드코딩 금지).
- 폰트 파일은 없다(Noto Sans KR을 Google Fonts에서 로드). Typography 페이지 글꼴 표시가 대체 글꼴일 수 있다.
- 웹폰트 `@import`는 `components/bundle.css`와 `styles.css` 두 곳에 있다.

## 이력

- 2026-10-29: 배포 코드 기준으로 디자인을 갱신(차이 기록: `diff-report-2026-10-29.md`), 단독 Claude Design에서 아티팩트로 이동, 새 형식으로 정리
  (tokens.json·컴포넌트별 미리보기·커버·FullSystem 카드). 이전 상태가 필요하면 아티팩트 버전 기록에서 찾는다.
