@AGENTS.md

## 하네스: Design → Frontend (Claude Design → Next.js 구현)

**목표:** Claude Design에서 만든 디자인 시스템/화면을 Next.js(App Router) + React + TS + Tailwind v4 코드로, 중복 없이 재사용 컴포넌트 중심으로 실무처럼 구현한다.

**트리거:** 디자인/화면/컴포넌트를 주며 프론트엔드 구현·수정·리팩터를 요청하면 `design-to-frontend` 스킬을 사용하라. (디자인 URL·스크린샷·JSX 제공, "이 화면 만들어줘", "이 컴포넌트만 다시", "variant 추가" 등 후속 요청 포함.) 단순 질문은 직접 응답 가능.

**스택:** Next.js 16 / React 19 / Tailwind v4(CSS `@theme` 토큰, `tailwind.config.js` 없음). 재사용 유틸: `cn()`(`src/lib/utils.ts`), variant는 `class-variance-authority`. 컴포넌트 구조 규약은 `src/components/README.md`.

**Git/PR 컨벤션 (Quizly 백엔드 기준):** 구현이 끝나면 `git-pr-workflow` 스킬로 **이슈 → `type/#이슈` 브랜치 → `type(#이슈): 설명` 커밋 → 푸시 → `main` 대상 PR**을 발행한다. **PR 머지는 사람이 직접 한다(자동 머지 금지).** 커밋 본문 끝에 하네스 표기 트레일러 2줄을 붙인다:
```
Generated with design-to-frontend harness (Claude Opus 4.8)
Co-Authored-By: Claude <noreply@anthropic.com>
```
타입: feat/fix/refactor/chore/infra/ci. 이슈·PR 템플릿은 `.github/`. 원격: `origin`(Social-Agent-Library-Management/frontend).

**문서 동기화:** 재사용 컴포넌트를 추가/변경하면 `src/components/README.md`의 **컴포넌트 인벤토리** 표를 같은 작업에서 갱신한다(QA가 일치 검증). **이 변경 이력 표는 하네스 자체가 바뀔 때만** 기록한다 — 화면/컴포넌트 기능 작업은 여기 남기지 않고 커밋·PR·이슈·README 인벤토리로 추적한다.

**문서 역할 분담 (README 비대화 방지):**

| 무엇을 | 어디에 |
|--------|--------|
| 어떤 컴포넌트가 있는가 | `src/components/README.md` 인벤토리 표 |
| 무엇을 하면 안 되는가 | `src/components/README.md` 합성 관계 |
| **왜 그렇게 결정했는가** | **커밋 본문** — README에 경위를 쓰지 않는다 |
| API·유틸 레이어 규약 | `src/lib/README.md` |
| 실행이 실제로 어떻게 돌아갔는가 | `.harness/metrics.md` (로깅 훅이 자동 기록) |

**실행 계측:** `.claude/hooks/harness_log.py`가 `SessionStart`/`SubagentStart|Stop`/`PostToolUse(Failure)`를 `.harness/runs/<session>.jsonl`에 기록한다(원시 로그는 gitignore, 요약·리포트는 커밋). 훅은 받아적기만 하고 집계는 `.claude/scripts/harness_report.py`가 오프라인으로 한다 — 훅 버그가 실행을 깨뜨리지 않게 하기 위함. 게이트 2개만 동기 실행된다: 커밋 트레일러 모델명 자동 교정(유일한 차단 지점), PR 생성 시 파이프라인 충실도 경고(차단 안 함). 회귀 테스트는 `python3 .claude/scripts/test_harness_log.py`.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-08-01 | 초기 구성 (에이전트 4 + 스킬 5 + Next.js 골대) | 전체 | 디자인→프론트 구현 하네스 신규 구축 |
| 2026-08-04 | Git/PR 자동화 추가 (git-pr-workflow 스킬, .github 템플릿, 오케스트레이터 Phase 5 발행 단계, B안 트레일러) | 스킬/워크플로/CLAUDE.md | 하네스 사용 시 Quizly 컨벤션대로 커밋·PR까지 발행 |
| 2026-08-09 | 문서 동기화 추가 (README 컴포넌트 인벤토리 신설 + 아키텍트 조회·구현자 갱신·QA 검증), 커밋 분할 정책 명문화 | README/스킬 4종/CLAUDE.md | 기능은 인벤토리+git, 하네스 변경만 이 표에 기록하도록 역할 분리 |
| 2026-09-08 | 실행 계측 도입 (로깅 훅 + 소급 베이스라인 리포터 + 회귀 테스트), `src/lib/README.md` 분리, 모델 트레일러 자동 스탬프 | .claude/hooks·scripts/src/lib/README.md/스킬 3종/CLAUDE.md | 과거 20개 PR 계측 결과 파이프라인 생략 10건·모델 오표기 18건이 무기록으로 발생 — 재연성·오류 원인 추적을 위해 계측 추가. `src/components/README.md` 재구조화는 PR #28과 충돌하므로 후속 이슈로 분리 |
