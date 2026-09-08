# 하네스 소급 베이스라인 — 훅 도입 이전 실행 계측

> 생성: `.claude/scripts/harness_report.py` — 2026-09-08 13:25 KST

훅을 넣기 전 실행들을 **사후에** 계측한 결과다. Claude Code가 세션마다 자동 저장한 트랜스크립트(`~/.claude/projects/`)에서 추출했으며, 하네스 자체는 이 정보를 아무것도 기록하지 않았다. 훅 도입 이후 수치와 비교하기 위한 고정 스냅샷이다.

## 실행별 지표

| PR | 이슈 | 실제 모델 | 소요(분) | 도구 | 실패 | 파이프라인 | 편집파일 | PR 규모 | 머지(분) | 사후 재작업 | 출처 |
|---:|---:|---|---:|---:|---:|:---:|---:|---|---:|---|---|
| #2 | #1 | Claude Opus 4.8 | 13281 | 153 | 6 | 0/4 | 22 | +1242/-12 | 2425 | - | transcript |
| #4 | #3 | Claude Sonnet 5 | 1041 | 280 | 4 | 4/4 | 48 | +1585/-40 | 418 | - | transcript |
| #6 | #5 | Claude Sonnet 5 | 51 | 145 | 1 | 3/4 | 18 | +242/-75 | 3 | - | transcript |
| #8 | #7 | Claude Sonnet 5 | 544 | 208 | 4 | 4/4 | 22 | +845/-21 | 381 | revert | transcript |
| #10 | #9 | Claude Sonnet 5 | 588 | 218 | 2 | 3/4 | 15 | +732/-43 | 750 | - | transcript |
| #12 | #11 | Claude Sonnet 5 | 48 | 166 | 1 | 2/4 | 13 | +568/-11 | 38 | - | transcript |
| #14 | #13 | Claude Sonnet 5 | 446 | 77 | 2 | 0/4 | 9 | +258/-2 | 149 | - | transcript |
| #16 | #15 | Claude Sonnet 5 | 32 | 198 | 0 | 4/4 | 15 | +369/-30 | 10 | - | transcript |
| #18 | #17 | Claude Sonnet 5 | 30 | 170 | 4 | 4/4 | 15 | +340/-44 | 765 | - | transcript |
| #20 | #19 | Claude Sonnet 5 | 81 | 213 | 2 | 4/4 | 12 | +33/-5 | 54 | - | transcript |
| #22 | #21 | Claude Sonnet 5 | 70 | 179 | 1 | 4/4 | 12 | +108/-323 | 54 | - | transcript |
| #24 | #23 | Claude Sonnet 5 | 283 | 228 | 6 | 4/4 | 16 | +617/-32 | 1335 | - | transcript |
| #26 | #25 | Claude Sonnet 5 | 439 | 238 | 3 | 4/4 | 13 | +473/-17 | 11227 | fix후속 | transcript |
| #28 | #27 | Claude Sonnet 5 | 21256 | 326 | 3 | 4/4 | 30 | +1613/-84 | - | - | transcript |
| #30 | #29 | Claude Sonnet 5 | 38 | 128 | 2 | 3/4 | 11 | +182/-14 | 512 | - | transcript |
| #32 | #31 | Claude Sonnet 5 | 94 | 178 | 5 | 3/4 | 16 | +257/-28 | 29 | - | transcript |
| #34 | #33 | Claude Sonnet 5 | 39 | 136 | 2 | 4/4 | 7 | +44/-11 | 144 | - | transcript |
| #36 | #35 | Claude Sonnet 5 | 28 | 66 | 2 | 0/4 | 3 | +20/-45 | 45 | - | transcript |
| #38 | #37 | Claude Opus 5 | 38 | 125 | 3 | 0/4 | 16 | +528/-49 | 16 | fix후속 | transcript |
| #40 | #39 | Claude Sonnet 5 | 55 | 121 | 3 | 0/4 | 11 | +33/-74 | 73 | - | transcript |

## 집계

- PR로 이어진 하네스 실행: **20건** (그 외 탐색·계획 세션 6건은 제외)
- 파이프라인 4/4 완주: **10/20**
  - 부분 생략 5건 — #6, #10, #12, #30, #32
  - **전문 에이전트 0개 5건 — #2, #14, #36, #38, #40**
- 도구 호출 합계 3553, 도구 실패 합계 56
- 소요 중앙값: 81분
- 사용된 모델: Claude Sonnet 5 18회, Claude Opus 4.8 1회, Claude Opus 5 1회

> PR #2는 하네스 자체를 구축한 최초 실행이라 전문 에이전트가 아직 존재하지 않았다. 충실도 0/4가 드리프트를 뜻하지 않는 유일한 행이다.

## 모델 표기 정확도

| PR | 실측 모델 (트랜스크립트) | 커밋 트레일러 표기 | 일치 |
|---:|---|---|:---:|
| #2 | Claude Opus 4.8 | Claude Opus 4.8 | O |
| #4 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #6 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #8 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #10 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #12 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #14 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #16 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #18 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #20 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #22 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #24 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #26 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #28 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #30 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #32 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #34 | Claude Sonnet 5 | Claude Opus 4.8 | X |
| #36 | Claude Sonnet 5 | Claude Sonnet 5 | O |
| #38 | Claude Opus 5 | Claude Opus 4.8 | X |
| #40 | Claude Sonnet 5 | Claude Opus 4.8 | X |

**18/20 PR의 커밋 트레일러가 실제 사용 모델과 다르다.** 트레일러 문자열은 `git-pr-workflow/SKILL.md`에 하드코딩돼 있고 "실제 사용 모델로 갱신한다"는 주석은 리더의 기억에 의존했다.

