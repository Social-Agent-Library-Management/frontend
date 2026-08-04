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

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-08-01 | 초기 구성 (에이전트 4 + 스킬 5 + Next.js 골대) | 전체 | 디자인→프론트 구현 하네스 신규 구축 |
| 2026-08-04 | Git/PR 자동화 추가 (git-pr-workflow 스킬, .github 템플릿, 오케스트레이터 Phase 5 발행 단계, B안 트레일러) | 스킬/워크플로/CLAUDE.md | 하네스 사용 시 Quizly 컨벤션대로 커밋·PR까지 발행 |
| 2026-08-09 | 문서 동기화 추가 (README 컴포넌트 인벤토리 신설 + 아키텍트 조회·구현자 갱신·QA 검증), 커밋 분할 정책 명문화 | README/스킬 4종/CLAUDE.md | 기능은 인벤토리+git, 하네스 변경만 이 표에 기록하도록 역할 분리 |
