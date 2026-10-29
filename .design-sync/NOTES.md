# Design sync notes

코드(`src/`) ↔ Claude Design 프로젝트를 맞추는 작업의 규칙. 연결 정보는 `config.json`.

## 방식: hand-mirror

- 대상: Claude Design `도서 관리 시스템 Design System` (`config.json`의 `projectId`).
- **배포 코드가 정답.** 디자인과 다르면 디자인을 코드에 맞춘다.
- 표준 /design-sync 변환기(전체 교체)를 쓰지 않는다. 디자이너식 구성(Brand → Colors → Type → Spacing → Components → Library Management)을 유지해야 하기 때문.
  코드(`src/components`)를 보고 인라인 스타일 JSX로 옮긴 사본을 **기존 경로에 덮어쓴다. 원격 파일은 지우지 않는다.**
- 건드리지 않는 원격 파일: `assets/`, `uploads/`, `scraps/`, `SKILL.md`, `guidelines/brand|colors-brand|spacing|type-weights`, `ui_kits/library/*명세*.md`, `thumbnail.html`.
- 토큰 이름은 디자인 쪽 이름 유지(값만 코드와 동일). 대응표는 원격 `readme.md`와 `tokens/*.css` 상단 주석.
- 로그인·알림 설정 화면은 코드에 없지만 디자인에 유지(2026-10-29 결정).

## 다음 동기화 시작점

- 기준 커밋: `config.json`의 `lastSyncedCommit`. 바뀐 것부터 본다: `git log <lastSyncedCommit>..main -- src/`
- 비교 결과는 `diff-report-<날짜>.md`로 남긴다(2026-10-29 리포트가 예시).

## 작업 도구 (claude.ai/design 단독 사이트에서만 유효 — 아래 "Claude 이전" 참고)

- 작업 폴더 `work/`(gitignore): 원격과 같은 레이아웃. 원격에서 받은 원본은 `backup/<날짜>/`(gitignore, 롤백용).
  둘 다 커밋되지 않으므로 새 환경에서는 원격에서 다시 받아 만든다.
- 번들 재생성: `node .design-sync/build-bundle.cjs .design-sync/work DesignSystem_307f43 .design-sync/work/_ds_bundle.js`
  (next 내장 babel 사용, 기존 format 4 헤더와 같은 형식 — 원본 JSX 8개로 다시 빌드했을 때 헤더가 원본과 일치함을 확인함).
- 미리보기 검증: `work/`를 `python3 -m http.server`로 띄우고 headless Chrome `--screenshot`으로 카드 확인
  (Chrome 확장은 localhost가 사이트 권한으로 막혀 있음).
- 업로드 순서: `_ds_needs_recompile` → 파일들 → `_ds_needs_recompile`. 삭제하지 않는다.
- `_ds_sync.json`(자동 동기화 기준점)은 만들지 않는다 — 변환기 산출물이 아니므로 다음 비교는 매번 전체 diff.
- `.d.ts`에 `@startingPoint`를 달 때 미리보기가 그룹 카드(여러 컴포넌트를 한 장에 모은 `*.card.html`)라면
  같은 화면이 중복 노출된다. StatCard·DdayCard는 2026-10-29에 제거했다.

## Claude 이전 (마감 2026-12-14)

단독 Claude Design(claude.ai/design)이 **2026-12-14**에 닫히고 Claude 아티팩트로 옮겨진다.
안내: https://support.claude.com/en/articles/17440474

- 디자인 시스템은 **자동 이동되지 않는다.** 소유자가 Claude → Artifacts 페이지의 "Move team design systems" 배너나 Claude Design 메뉴로 직접 옮긴다. 유료 플랜부터 순차 적용.
- 옮긴 뒤 단독 사이트 원본은 **읽기 전용**이 되고 되돌릴 수 없다. 채팅·댓글은 넘어가지 않는다.
- 옮긴 뒤에는 페이지에서 직접 편집이 아직 안 되고, Claude에게 요청해 수정한다.

**이전 전 체크리스트**
1. 2026-10-29 반영분을 Claude Design에서 확인(고칠 게 있으면 단독 사이트에 있을 때 고친다).
2. 프로젝트 .zip 내려받기: Share → Project HTML → Project archive → Export.
3. 남길 채팅·댓글 따로 저장.
4. Artifacts 페이지에서 이동.

**이전 후 할 일 (레포)**
1. 새 아티팩트 링크(`claude.ai/artifact/…`)를 `config.json`의 `migration.artifactUrl`에 적고 `status`를 `moved`, `movedOn`에 날짜.
2. 위 "작업 도구" 절차(DesignSync 업로드·`/design-login`)는 더 이상 쓰지 않는다. 동기화는
   - 읽기: Claude Code의 Artifact 도구 `read`로 아티팩트를 읽어 코드와 비교
   - 쓰기: 바뀐 내용을 Claude에게 요청해 반영(또는 아티팩트 쓰기 권한이 있으면 Artifact 도구로 갱신)
   로 바꾸고 이 절을 실제 써 본 절차로 고친다.
3. 하네스(`design-spec-extraction`)는 이미 아티팩트 링크를 입력으로 받도록 되어 있다.
