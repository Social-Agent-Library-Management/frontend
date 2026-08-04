---
name: design-to-frontend
description: "Claude Design에서 만든 디자인 시스템/화면을 Next.js(App Router) + React + TypeScript + Tailwind 실제 프론트엔드 코드로 구현하는 에이전트 팀을 조율하는 오케스트레이터. 디자인 해석 → 컴포넌트 재사용 설계 → 구현 → QA 파이프라인으로, 중복 없이 실무 회사처럼 개발한다. 트리거: '이 디자인/화면/컴포넌트 구현해줘', '디자인 붙여줄게 만들어줘', 디자인 URL/스크린샷/JSX를 주며 프론트 구현 요청. 후속 작업: 구현 수정/보완, 컴포넌트 리팩터, 이 화면만 다시, 다른 화면 추가, 이전 구현 개선, variant 추가, 반응형 수정 요청 시에도 반드시 이 스킬을 사용."
---

# Design → Frontend Orchestrator

Claude Design 산출물을 Next.js 프론트엔드 코드로 구현하는 에이전트 팀을 조율한다. 핵심 목표: **중복 없이, 재사용 컴포넌트 중심으로, 실무 회사처럼** 구현한다.

## 실행 모드: 에이전트 팀

파이프라인(해석→설계→구현→QA)이지만 에이전트 팀으로 운영한다. 이유: 설계자↔구현자↔검증자의 피드백 루프가 품질의 핵심이다. QA가 발견한 중복/불일치를 구현자에게, 구현 중 발견한 더 나은 분해를 설계자에게 실시간 전달한다.

## 에이전트 구성

| 팀원 | 타입 | 역할 | 스킬 | 출력 |
|------|------|------|------|------|
| design-interpreter | 커스텀(opus) | 디자인→구조화 스펙 | design-spec-extraction | `_workspace/01_design-spec.md` |
| component-architect | 커스텀(opus) | 재사용 설계·중복 제거 | component-reuse-design | `_workspace/02_component-plan.md` |
| frontend-implementer | 커스텀(opus) | Next.js 코드 구현 | nextjs-implementation | `src/**` + `_workspace/03_implementation-report.md` |
| qa-inspector | general-purpose(opus) | 검증·정합성·중복 검사 | frontend-qa-verification | `_workspace/04_qa-report.md` |
| (리더 = 오케스트레이터) | — | 조율·통합·사용자 보고 | — | 최종 요약 |

> 모든 Agent/TeamCreate 호출에 `model: "opus"`를 명시한다.

## 워크플로우

### Phase 0: 컨텍스트 확인

1. **프로젝트 초기화 확인.** `package.json`이 없으면 Next.js가 아직 스캐폴드되지 않은 것 — 사용자에게 알리고 스캐폴딩부터 진행한다(정상 구성 시 이미 완료돼 있음).
2. **`src/lib/utils.ts`(cn), `src/components/ui/`, `src/components/` 존재 확인.** 없으면 골대가 미비한 것이므로 최소 골대를 먼저 세운다.
3. **실행 모드 판별:**
   - `_workspace/` 미존재 → **초기 실행**
   - `_workspace/` 존재 + 사용자가 부분 수정 요청("이 컴포넌트만 다시", "variant 추가") → **부분 재실행**. 해당 단계 에이전트만 재호출하고 이전 산출물을 읽어 반영
   - `_workspace/` 존재 + 새 화면/컴포넌트 요청 → **새 실행**. 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동 후 새로 시작

### Phase 1: 입력 수집 & 이슈 생성

1. 사용자가 준 디자인 참조의 형태를 파악한다(디자인 URL / 내보낸 JSX / 스크린샷 / 설명).
2. `_workspace/00_input/`에 저장한다(코드는 파일로, URL은 메모로, 이미지는 경로 기록).
3. 무엇을 구현하는지(화면 1개? 컴포넌트 1개? 전체 플로우?) 범위를 확정한다. 모호하면 사용자에게 확인한다.
4. **GitHub 이슈 생성**(`git-pr-workflow` 스킬 참조). 범위가 확정되면 타입(feat/refactor/fix…)을 정하고 `gh issue create`로 이슈를 만들어 **이슈 번호를 캡처**한다. 원격/gh 권한이 없으면 `(NONE)`으로 폴백하고 사용자에게 알린다.
5. **작업 브랜치 생성**: 최신 `main`에서 `type/#이슈번호`로 분기한다.

### Phase 2: 팀 구성

```
TeamCreate(
  team_name: "design-frontend-team",
  members: [
    { name: "design-interpreter", agent_type: "design-interpreter", model: "opus",
      prompt: "design-spec-extraction 스킬로 _workspace/00_input/의 디자인을 _workspace/01_design-spec.md로 해석. 반복 패턴을 '중복 후보'로 표시하는 것이 최우선." },
    { name: "component-architect", agent_type: "component-architect", model: "opus",
      prompt: "01_design-spec 완성 후, component-reuse-design 스킬로 기존 src/components를 먼저 스캔하고 재사용/확장/신규를 결정해 _workspace/02_component-plan.md 작성. 중복 제거가 핵심." },
    { name: "frontend-implementer", agent_type: "frontend-implementer", model: "opus",
      prompt: "02_component-plan 완성 후, nextjs-implementation 스킬로 프리미티브→합성→페이지 순서로 구현. 계획의 재사용 결정을 그대로 따르고 tsc·build로 자가 검증." },
    { name: "qa-inspector", agent_type: "qa-inspector", model: "opus",
      prompt: "각 모듈 구현 직후 frontend-qa-verification 스킬로 통합 정합성·중복·스펙·빌드를 검증해 _workspace/04_qa-report.md 작성. FIX/REDO는 구체적 수정 지시와 함께 담당자에게 전달." }
  ]
)
```

작업 등록(의존성 명시):
```
TaskCreate(tasks: [
  { title: "디자인 스펙 해석", assignee: "design-interpreter" },
  { title: "컴포넌트 재사용 설계", assignee: "component-architect", depends_on: ["디자인 스펙 해석"] },
  { title: "프론트엔드 구현", assignee: "frontend-implementer", depends_on: ["컴포넌트 재사용 설계"] },
  { title: "QA 검증", assignee: "qa-inspector", depends_on: ["프론트엔드 구현"] }
])
```

### Phase 3: 파이프라인 실행 (팀 자체 조율)

순차 의존이지만 팀 통신으로 피드백 루프를 돌린다:
- design-interpreter가 스펙 완성 → component-architect에게 반복 패턴을 SendMessage로 강조
- component-architect가 계획 완성 → frontend-implementer에게 컴포넌트 트리·구현 순서 전달
- frontend-implementer가 각 모듈 완성 → qa-inspector가 즉시 검증(incremental QA)
- qa-inspector의 FIX/REDO → 담당 에이전트에게 SendMessage(파일:라인 + 수정 방법). 경계면 이슈는 양쪽 모두에게
- 구현 중 계획과 어긋나는 상황 → implementer가 architect에게 협의 후 계획 갱신

**리더 모니터링:** TaskGet으로 진행 확인, 막힌 팀원에게 SendMessage로 개입, 유휴 알림 수신.

**재검증 루프 제한:** QA 재검증은 항목당 최대 2회. 이후에도 FIX/REDO가 남으면 리더가 사용자에게 판단을 요청한다.

### Phase 4: 통합 & 검수

1. 모든 작업 완료 대기(TaskGet). QA가 최종 PASS이거나 잔여 이슈가 사용자 확인 대상만 남았는지 확인.
2. `_workspace/`의 4개 산출물을 Read해 결과를 종합한다.

### Phase 5: Git & PR 발행 (`git-pr-workflow` 스킬)

QA가 PASS(또는 잔여가 사용자 확인 대상만)이면 리더가 결과를 발행한다. **머지는 하지 않는다.**

1. `type(#이슈): 설명` 컨벤션으로 커밋. 본문 끝에 **B안 트레일러** 2줄 부착:
   ```
   Generated with design-to-frontend harness (Claude Opus 4.8)
   Co-Authored-By: Claude <noreply@anthropic.com>
   ```
2. `git push -u origin type/#이슈`. (빈 레포면 먼저 `main`을 원격에 확립)
3. `gh pr create --base main`로 PR 생성. 본문은 PR 템플릿 형식, 테스트 체크박스는 실제 통과분만 체크, QA 보류 항목은 "주의 사항"에 기재.
4. 원격/gh 권한이 없으면 커밋까지만 하고 수동 PR 방법을 안내한다.

### Phase 6: 보고 & 정리

1. 사용자에게 보고: 구현된 화면/컴포넌트, 생성/재사용한 컴포넌트 목록, 추가한 토큰, 빌드·타입체크 결과, 미확정/보류 항목, **이슈·브랜치·PR URL**, "머지는 직접 진행" 안내, 실행법(`npm run dev`).
2. 팀원 종료 요청(SendMessage) 후 TeamDelete.
3. `_workspace/` 보존(사후 추적용).
4. 피드백 요청: "컴포넌트 분해나 구현 방향에서 바꾸고 싶은 점이 있나요?" 피드백이 있으면 부분 재실행 또는 하네스 진화로 반영.

## 데이터 흐름

```
[이슈 생성 + type/#이슈 브랜치]
       ↓
[00_input] → interpreter → [01_design-spec] → architect → [02_component-plan]
                                                              ↓
                                                        implementer → [src/** + 03_report]
                                                              ↓↑ (FIX 루프)
                                                        qa-inspector → [04_qa-report]
                                                              ↓
                                          [리더: 커밋(B안 트레일러) → 푸시 → PR(main, 머지 X) → 보고]
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| 스펙 미확정 항목 | 지어내지 않고 사용자 확인 요청. QA는 "미검증"으로 분류 |
| 팀원 1명 실패 | 리더가 SendMessage로 상태 확인 → 재시작, 안 되면 리더가 해당 단계 직접 수행 |
| 빌드/타입 에러 지속 | implementer가 근본 원인 수정(우회 캐스팅 금지). 2회 후 사용자 보고 |
| 계획-구현 충돌 | architect와 implementer가 협의해 계획 갱신 후 진행 |
| Next.js 16 API 불확실 | implementer가 `node_modules/next/dist/docs/` 확인 후 작성 |
| 원격/gh 권한 없음 | 커밋까지만 하고 수동 PR 방법 안내(`git-pr-workflow` 실패 대응) |
| PR 머지 요청받음 | 자동 머지 금지 — 머지는 사용자가 직접. PR URL만 제공 |

## 테스트 시나리오

### 정상 흐름
1. 사용자가 대시보드 화면 JSX를 제공
2. interpreter가 StatCard×4, NavItem×6을 "중복 후보"로 표시한 스펙 생성
3. architect가 기존 컴포넌트 스캔 → StatCard를 tone variant 1개로 통합 설계
4. implementer가 프리미티브→합성→페이지 순으로 구현, 재사용 결정 준수
5. qa가 빌드 통과·중복 없음·라우팅 정합 확인, PASS
6. 리더가 결과 보고, 팀 정리
7. 예상: `src/components/`에 재사용 컴포넌트 + `src/app/`에 페이지, 빌드 통과

### 에러 흐름
1. qa가 implementer의 StatCard 복제(계획은 재사용 지시)를 발견
2. qa가 implementer에게 "stat-card.tsx 재사용, 신규 복제 제거" SendMessage(파일:라인 포함)
3. implementer 수정 → qa 재검증 PASS
4. 2회 내 미해결이면 리더가 사용자에게 보고
