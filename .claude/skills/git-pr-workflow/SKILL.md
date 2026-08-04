---
name: git-pr-workflow
description: "구현 완료 후 커밋·브랜치·이슈·PR을 Quizly 팀 컨벤션으로 발행하는 절차. 커밋 메시지 type(#이슈): 설명, 브랜치 type/#이슈, gh로 이슈 자동 생성, PR 템플릿대로 생성(main 대상, 머지는 사람이 함), 하네스 표기 트레일러(B안) 부착을 강제한다. design-to-frontend 오케스트레이터의 리더가 사용."
---

# Git & PR Workflow (Quizly 컨벤션)

Claude Design → Frontend 구현이 끝나면 결과를 **이슈 → 브랜치 → 커밋 → 푸시 → PR** 흐름으로 발행한다.
컨벤션은 Quizly 백엔드 레포(github.com/Quizly-Team/backend)를 기준으로 한다.
**PR 머지는 사람이 한다 — 자동 머지 금지.**

## 0. 원칙

- 커밋 제목은 **한 줄** `type(#이슈): 한글 설명`. oneline 히스토리를 깔끔하게 유지한다.
- 하네스가 만든 산출물임을 **트레일러(B안)**로 표기한다(아래 5).
- 이슈 없이 진행하는 예외 상황이면 `(NONE)`을 쓴다(기본은 이슈 자동 생성).
- 원격이 없거나 권한이 없으면 **커밋까지만** 하고 사용자에게 알린다(PR 생략).

## 1. 타입 매핑 (프론트)

| type | 사용 상황 |
|------|-----------|
| `feat` | 새 화면·컴포넌트·기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 컴포넌트 추출·중복 제거·구조 개선(동작 불변) |
| `chore` | 설정·의존성·문서·도구 |
| `infra` | 빌드·CI·배포 환경 |
| `ci` | CI 워크플로 |

## 2. 이슈 생성 (기본: 자동)

구현 범위가 확정되면 **먼저 이슈를 만든다**. 템플릿(`.github/ISSUE_TEMPLATE/`)의 본문 형식을 따른다.

```bash
gh issue create \
  --title "feat: 대시보드 화면 구현" \
  --label feature \
  --body "$(cat <<'EOF'
## 구현 계획
- 대시보드 레이아웃(사이드바 + 통계 카드 4개 + 차트)
- StatCard 재사용 컴포넌트로 통합
EOF
)"
```

- 제목 접두사와 라벨은 타입에 맞춘다: feat→feature, bug→bug, refactor→refactor, infra→infra, chore→task.
- 본문: feature/infra/task는 `## 구현 계획`, bug/refactor는 `## 문제 상황(배경)` + `## 해결 방안(구현 계획)`.
- 생성된 **이슈 번호를 캡처**한다(예: 출력 URL 끝 숫자). 이후 브랜치·커밋·PR에 재사용한다.

## 3. 브랜치 생성

```bash
git switch -c feat/#12    # type/#이슈번호
```

- 항상 최신 `main`에서 분기한다(`git switch main && git pull` 후 분기).
- 이슈가 없으면 서술형 브랜치명 사용(예: `chore/github-templates`).

## 4. 커밋 (정책: 논리 단위 분리)

- **요청 1건 = 이슈 1개 = PR 1개**(고정). 갈리는 것은 그 PR 안의 커밋 수뿐이다.
- **커밋은 논리 단위로 분리한다.** 화면 + API 명세를 받으면 보통 다음 순서로 나눈다:
  1. `feat(#N): {화면} API 연동 레이어 추가` — 타입/훅/fetch 함수
  2. `feat(#N): {화면} UI 구현` — 컴포넌트/페이지
  3. `refactor(#N): 반복 마크업 {컴포넌트}로 추출` — 중복 제거가 있을 때만
- **작은 화면(레이어 분리가 무의미한 규모)은 1커밋**으로 합친다. 억지로 쪼개지 않는다.
- QA가 PASS(또는 잔여가 사용자 확인 대상만)일 때 커밋한다. **각 커밋 제목은 한 줄 컨벤션**을 지키고, **모든 커밋에 B안 트레일러**(아래 5)를 붙인다.
- 커밋 author는 사용자 git config 그대로 둔다(사람이 주저자, Claude는 co-author).

## 5. 하네스 표기 트레일러 (B안 — 필수)

커밋 본문 끝(빈 줄 뒤)에 아래 2줄을 붙인다:

```
Generated with design-to-frontend harness (Claude Opus 4.8)
Co-Authored-By: Claude <noreply@anthropic.com>
```

- 모델명은 실제 사용 모델로 갱신한다(예: `Claude Opus 4.8`).
- 트레일러는 본문에만 들어가므로 `git log --oneline`에는 제목만 보인다.
- 커밋 예시:

```bash
git commit -m "feat(#12): 대시보드 화면 구현" \
           -m "Generated with design-to-frontend harness (Claude Opus 4.8)" \
           -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

> 여러 `-m`은 각각 문단이 되어 제목 / 트레일러가 빈 줄로 분리된다.

## 6. 푸시 & PR 생성 (머지는 사람)

```bash
git push -u origin feat/#12

gh pr create \
  --base main \
  --title "feat(#12): 대시보드 화면 구현" \
  --body "$(cat <<'EOF'
## 연관 이슈
- 이 PR이 해결하는 이슈: #12

## 작업 사항
- 대시보드 화면 구현 (사이드바 + 통계 카드 + 차트)
- StatCard 재사용 컴포넌트 신규 추가, 반복 마크업 제거

## 테스트
- [x] 로컬 실행 확인 (`npm run dev`)
- [x] 타입체크 / 빌드 통과 (`npm run build`)

## 주의 사항 및 참고사항
- 추가한 @theme 토큰: --color-primary, --radius-card
EOF
)"
```

- **`--base main` 고정**(단일 브랜치 전략). PR 제목 = 대표 커밋 제목.
- PR 본문은 `.github/PULL_REQUEST_TEMPLATE.md` 형식을 따르고, 테스트 체크박스는 **실제 통과한 것만** 체크한다.
- QA 리포트의 미검증/보류 항목은 "주의 사항"에 적는다.
- **`gh pr merge`를 실행하지 않는다.** 생성 후 PR URL만 사용자에게 보고한다.

## 7. 보고

리더는 최종 보고에 다음을 포함한다: 생성한 이슈 번호/URL, 브랜치명, 커밋 목록(제목), **PR URL**, "머지는 직접 진행해주세요" 안내.

## 실패 대응

| 상황 | 대응 |
|------|------|
| 원격 origin 없음 | 커밋까지만. `git remote add origin <url>` 안내 후 사용자 확인 |
| gh 인증/권한 없음 | 커밋·푸시까지 시도, PR 생성 실패 시 수동 생성 명령을 사용자에게 제공 |
| main이 원격에 없음(빈 레포) | 먼저 `git push -u origin main`으로 base 확립 후 브랜치 PR |
| 이슈 생성 실패 | `(NONE)`으로 폴백하고 사용자에게 알림 |
