#!/usr/bin/env python3
"""
design-to-frontend 하네스 실행 계측 리포터.

두 종류의 입력을 같은 Run 스키마로 정규화한다:
  A) 과거 세션 트랜스크립트  ~/.claude/projects/<slug>/*.jsonl   (소급 베이스라인)
  B) 로깅 훅 원시 이벤트      .harness/runs/<session_id>.jsonl    (훅 도입 이후)

덕분에 before/after가 한 표에서 비교된다.

사용:
  python3 .claude/scripts/harness_report.py --baseline   # .harness/baseline.md 생성 (A만)
  python3 .claude/scripts/harness_report.py --metrics    # .harness/metrics.md  생성 (A+B)
  python3 .claude/scripts/harness_report.py --print      # stdout으로만 출력

표준 라이브러리만 사용한다.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path

# 하네스가 실행해야 하는 전문 에이전트 4종 (design-to-frontend/SKILL.md Phase 2)
REQUIRED_AGENTS = (
    "design-interpreter",
    "component-architect",
    "frontend-implementer",
    "qa-inspector",
)

# 커밋 트레일러에 쓰는 사람이 읽는 모델명
MODEL_LABELS = {
    "claude-opus-4-8": "Claude Opus 4.8",
    "claude-opus-5": "Claude Opus 5",
    "claude-sonnet-5": "Claude Sonnet 5",
    "claude-haiku-4-5-20251001": "Claude Haiku 4.5",
}

REPO = Path(__file__).resolve().parents[2]
HARNESS_DIR = REPO / ".harness"
GH_CACHE = HARNESS_DIR / ".gh-cache.json"


def model_label(model_id: str) -> str:
    if not model_id:
        return "?"
    if model_id in MODEL_LABELS:
        return MODEL_LABELS[model_id]
    # 미지의 id는 날짜 접미사만 떼고 원문 유지 — 추측해서 틀리는 것보다 낫다
    return re.sub(r"-\d{8}$", "", model_id)


def transcript_dir() -> Path:
    """Claude Code가 이 저장소 세션을 저장하는 디렉터리."""
    slug = str(REPO).replace("/", "-")
    return Path.home() / ".claude" / "projects" / slug


def parse_ts(value: str):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def iter_jsonl(path: Path):
    try:
        with path.open(encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    yield json.loads(line)
                except json.JSONDecodeError:
                    continue
    except OSError:
        return


def blank_run(session_id: str, source: str) -> dict:
    return {
        "session_id": session_id,
        "source": source,
        "pr": None,
        "issue": None,
        "branch": None,
        "models": set(),
        "start": None,
        "end": None,
        "tool_calls": 0,
        "tool_errors": 0,
        "agents": Counter(),
        "files": set(),
        "tokens_in": 0,
        "tokens_out": 0,
        "prompt": None,
    }


def bump_window(run: dict, ts) -> None:
    if ts is None:
        return
    if run["start"] is None or ts < run["start"]:
        run["start"] = ts
    if run["end"] is None or ts > run["end"]:
        run["end"] = ts


# --------------------------------------------------------------------------
# 입력 A — 과거 세션 트랜스크립트 (소급)
# --------------------------------------------------------------------------

def load_transcript_runs() -> list[dict]:
    tdir = transcript_dir()
    if not tdir.is_dir():
        print(f"[warn] 트랜스크립트 디렉터리 없음: {tdir}", file=sys.stderr)
        return []

    runs = []
    for path in sorted(tdir.glob("*.jsonl")):
        run = blank_run(path.stem, "transcript")

        for entry in iter_jsonl(path):
            bump_window(run, parse_ts(entry.get("timestamp")))

            if entry.get("type") == "pr-link" and entry.get("prNumber"):
                run["pr"] = entry["prNumber"]
            if entry.get("gitBranch"):
                run["branch"] = entry["gitBranch"]

            if entry.get("type") == "user" and run["prompt"] is None:
                content = (entry.get("message") or {}).get("content")
                if isinstance(content, str) and content.strip():
                    run["prompt"] = content.strip()

            message = entry.get("message")
            if not isinstance(message, dict):
                continue
            if message.get("model"):
                run["models"].add(message["model"])

            usage = message.get("usage") or {}
            run["tokens_in"] += (
                usage.get("input_tokens", 0)
                + usage.get("cache_read_input_tokens", 0)
                + usage.get("cache_creation_input_tokens", 0)
            )
            run["tokens_out"] += usage.get("output_tokens", 0)

            content = message.get("content")
            if not isinstance(content, list):
                continue
            for block in content:
                if not isinstance(block, dict):
                    continue
                if block.get("type") == "tool_use":
                    run["tool_calls"] += 1
                    name = block.get("name")
                    args = block.get("input") or {}
                    if name == "Agent":
                        run["agents"][args.get("subagent_type") or "(none)"] += 1
                    elif name in ("Edit", "Write", "NotebookEdit"):
                        target = args.get("file_path")
                        if target:
                            run["files"].add(target)
                elif block.get("type") == "tool_result" and block.get("is_error"):
                    run["tool_errors"] += 1

        # 서브에이전트 트랜스크립트는 별도 파일에 있다 — 도구 호출·토큰을 합산
        for sub in sorted((tdir / path.stem).glob("subagents/*.jsonl")):
            for entry in iter_jsonl(sub):
                bump_window(run, parse_ts(entry.get("timestamp")))
                message = entry.get("message")
                if not isinstance(message, dict):
                    continue
                usage = message.get("usage") or {}
                run["tokens_in"] += (
                    usage.get("input_tokens", 0)
                    + usage.get("cache_read_input_tokens", 0)
                    + usage.get("cache_creation_input_tokens", 0)
                )
                run["tokens_out"] += usage.get("output_tokens", 0)
                content = message.get("content")
                if not isinstance(content, list):
                    continue
                for block in content:
                    if not isinstance(block, dict):
                        continue
                    if block.get("type") == "tool_use":
                        run["tool_calls"] += 1
                        args = block.get("input") or {}
                        if block.get("name") in ("Edit", "Write", "NotebookEdit"):
                            target = args.get("file_path")
                            if target:
                                run["files"].add(target)
                    elif block.get("type") == "tool_result" and block.get("is_error"):
                        run["tool_errors"] += 1

        runs.append(run)
    return runs


# --------------------------------------------------------------------------
# 입력 B — 로깅 훅 원시 이벤트 (훅 도입 이후)
# --------------------------------------------------------------------------

def load_hook_runs() -> list[dict]:
    runs_dir = HARNESS_DIR / "runs"
    if not runs_dir.is_dir():
        return []

    runs = []
    for path in sorted(runs_dir.glob("*.jsonl")):
        run = blank_run(path.stem, "hook")
        for event in iter_jsonl(path):
            bump_window(run, parse_ts(event.get("t")))
            kind = event.get("ev")

            if event.get("model"):
                run["models"].add(event["model"])
            if event.get("branch"):
                run["branch"] = event["branch"]

            if kind == "UserPromptSubmit" and run["prompt"] is None:
                run["prompt"] = event.get("prompt")
            elif kind == "SubagentStop":
                run["agents"][event.get("agent_type") or "(none)"] += 1
            elif kind == "PostToolUse":
                run["tool_calls"] += 1
                target = event.get("target")
                if event.get("tool") in ("Edit", "Write", "NotebookEdit") and target:
                    run["files"].add(target)
            elif kind == "PostToolUseFailure":
                run["tool_errors"] += 1
            elif kind == "PrCreated" and event.get("pr"):
                run["pr"] = event["pr"]

        runs.append(run)
    return runs


# --------------------------------------------------------------------------
# git / gh 보강
# --------------------------------------------------------------------------

def run_cmd(args: list[str]) -> str:
    try:
        out = subprocess.run(
            args, cwd=REPO, capture_output=True, text=True, timeout=60
        )
        return out.stdout if out.returncode == 0 else ""
    except (OSError, subprocess.SubprocessError):
        return ""


def load_gh_cache() -> dict:
    if GH_CACHE.is_file():
        try:
            return json.loads(GH_CACHE.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            pass
    return {}


def fetch_pr_meta(pr_numbers: list[int], refresh: bool) -> dict:
    """PR 메타를 gh로 가져와 캐시한다. 오프라인이면 캐시만 사용."""
    cache = load_gh_cache()
    fields = "number,title,additions,deletions,changedFiles,createdAt,mergedAt,headRefName"
    for pr in pr_numbers:
        key = str(pr)
        if key in cache and not refresh:
            continue
        raw = run_cmd(["gh", "pr", "view", str(pr), "--json", fields])
        if not raw:
            continue
        try:
            cache[key] = json.loads(raw)
        except json.JSONDecodeError:
            continue
    HARNESS_DIR.mkdir(parents=True, exist_ok=True)
    GH_CACHE.write_text(json.dumps(cache, indent=1, ensure_ascii=False), encoding="utf-8")
    return cache


def load_rework_index() -> dict:
    """git 히스토리에서 이슈별 사후 재작업 신호를 뽑는다.

    - revert : `Revert "type(#N): ..."` 커밋이 존재
    - fix후속: 같은 이슈 번호로 feat 이후 fix 커밋이 추가로 존재
    """
    log = run_cmd(["git", "log", "--all", "--format=%s"])
    reverted, types_by_issue = set(), {}

    for subject in log.splitlines():
        match = re.search(r"#(\d+)", subject)
        if not match:
            continue
        issue = int(match.group(1))
        if subject.startswith("Revert"):
            reverted.add(issue)
            continue
        kind = subject.split("(", 1)[0].strip().lower()
        types_by_issue.setdefault(issue, set()).add(kind)

    index = {}
    for issue, kinds in types_by_issue.items():
        signals = []
        if issue in reverted:
            signals.append("revert")
        if "feat" in kinds and "fix" in kinds:
            signals.append("fix후속")
        index[issue] = " ".join(signals) or "-"
    for issue in reverted:
        index.setdefault(issue, "revert")
    return index


# --------------------------------------------------------------------------
# 파생 지표
# --------------------------------------------------------------------------

def enrich(run: dict, pr_meta: dict, rework: dict) -> dict:
    used = set(run["agents"])
    run["fidelity"] = sum(1 for agent in REQUIRED_AGENTS if agent in used)
    run["missing"] = [a for a in REQUIRED_AGENTS if a not in used]

    if run["start"] and run["end"]:
        run["minutes"] = round((run["end"] - run["start"]).total_seconds() / 60)
    else:
        run["minutes"] = None

    run["model_label"] = " / ".join(sorted(model_label(m) for m in run["models"])) or "?"

    meta = pr_meta.get(str(run["pr"])) if run["pr"] else None
    if meta:
        run["pr_add"] = meta.get("additions")
        run["pr_del"] = meta.get("deletions")
        run["pr_files"] = meta.get("changedFiles")
        run["title"] = meta.get("title", "")
        run["branch"] = meta.get("headRefName") or run["branch"]
        created, merged = parse_ts(meta.get("createdAt")), parse_ts(meta.get("mergedAt"))
        run["merge_minutes"] = (
            round((merged - created).total_seconds() / 60) if created and merged else None
        )
    else:
        run.update(pr_add=None, pr_del=None, pr_files=None, title="", merge_minutes=None)

    issue = None
    if run.get("title"):
        match = re.search(r"#(\d+)", run["title"])
        if match:
            issue = int(match.group(1))
    if issue is None and run.get("branch"):
        match = re.search(r"#(\d+)", run["branch"])
        if match:
            issue = int(match.group(1))
    run["issue"] = issue
    run["rework"] = rework.get(issue, "-") if issue else "-"
    return run


# --------------------------------------------------------------------------
# 렌더링
# --------------------------------------------------------------------------

def fmt(value, dash="-"):
    return dash if value is None else str(value)


def render(runs: list[dict], title: str, note: str) -> str:
    # PR로 이어진 실행만 하네스 실행으로 센다. 나머지는 탐색·계획 세션이라
    # 파이프라인 충실도를 따질 대상이 아니다 (분모를 오염시킨다).
    shipped = sorted(
        (r for r in runs if r["pr"]), key=lambda r: (r["pr"], r["start"] or datetime.min)
    )
    other = [r for r in runs if not r["pr"]]
    generated = datetime.now().astimezone().strftime("%Y-%m-%d %H:%M %Z")

    lines = [
        f"# {title}",
        "",
        f"> 생성: `.claude/scripts/harness_report.py` — {generated}",
        "",
        note,
        "",
        "## 실행별 지표",
        "",
        "| PR | 이슈 | 실제 모델 | 소요(분) | 도구 | 실패 | 파이프라인 | 편집파일 | PR 규모 | 머지(분) | 사후 재작업 | 출처 |",
        "|---:|---:|---|---:|---:|---:|:---:|---:|---|---:|---|---|",
    ]

    for run in shipped:
        size = (
            f"+{run['pr_add']}/-{run['pr_del']}"
            if run["pr_add"] is not None
            else "-"
        )
        lines.append(
            "| {pr} | {issue} | {model} | {minutes} | {tools} | {errors} | {fid}/4 | {files} | {size} | {merge} | {rework} | {src} |".format(
                pr=f"#{run['pr']}" if run["pr"] else "-",
                issue=f"#{run['issue']}" if run["issue"] else "-",
                model=run["model_label"],
                minutes=fmt(run["minutes"]),
                tools=run["tool_calls"],
                errors=run["tool_errors"],
                fid=run["fidelity"],
                files=len(run["files"]),
                size=size,
                merge=fmt(run["merge_minutes"]),
                rework=run["rework"],
                src=run["source"],
            )
        )

    lines += ["", "## 집계", ""]
    total = len(shipped)
    full = [r for r in shipped if r["fidelity"] == 4]
    none = [r for r in shipped if r["fidelity"] == 0]
    partial = [r for r in shipped if 0 < r["fidelity"] < 4]
    models = Counter(r["model_label"] for r in shipped)
    durations = sorted(r["minutes"] for r in shipped if r["minutes"] is not None)
    median = durations[len(durations) // 2] if durations else None

    def prs(rows):
        return ", ".join("#" + str(r["pr"]) for r in rows) or "없음"

    lines += [
        f"- PR로 이어진 하네스 실행: **{total}건** (그 외 탐색·계획 세션 {len(other)}건은 제외)",
        f"- 파이프라인 4/4 완주: **{len(full)}/{total}**",
        f"  - 부분 생략 {len(partial)}건 — {prs(partial)}",
        f"  - **전문 에이전트 0개 {len(none)}건 — {prs(none)}**",
        f"- 도구 호출 합계 {sum(r['tool_calls'] for r in shipped)}, 도구 실패 합계 {sum(r['tool_errors'] for r in shipped)}",
        f"- 소요 중앙값: {fmt(median)}분",
        f"- 사용된 모델: {', '.join(f'{m} {n}회' for m, n in models.most_common())}",
        "",
        "> PR #2는 하네스 자체를 구축한 최초 실행이라 전문 에이전트가 아직 존재하지 않았다. "
        "충실도 0/4가 드리프트를 뜻하지 않는 유일한 행이다.",
        "",
    ]

    lines += ["## 모델 표기 정확도", ""]
    lines += [
        "| PR | 실측 모델 (트랜스크립트) | 커밋 트레일러 표기 | 일치 |",
        "|---:|---|---|:---:|",
    ]
    mismatched = 0
    for run in shipped:
        body = run_cmd(["git", "log", "--all", "--format=%b", f"--grep=(#{run['issue']}):"])
        declared = sorted(set(re.findall(r"design-to-frontend harness \(([^)]*)\)", body)))
        shown = " / ".join(declared) or "-"
        ok = bool(declared) and set(declared) == {run["model_label"]}
        if declared and not ok:
            mismatched += 1
        lines.append(
            f"| #{run['pr']} | {run['model_label']} | {shown} | {'O' if ok else 'X'} |"
        )
    lines += [
        "",
        f"**{mismatched}/{total} PR의 커밋 트레일러가 실제 사용 모델과 다르다.** "
        "트레일러 문자열은 `git-pr-workflow/SKILL.md`에 하드코딩돼 있고 "
        "\"실제 사용 모델로 갱신한다\"는 주석은 리더의 기억에 의존했다.",
        "",
    ]

    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="하네스 실행 계측 리포터")
    parser.add_argument("--baseline", action="store_true", help=".harness/baseline.md 생성 (과거 트랜스크립트만)")
    parser.add_argument("--metrics", action="store_true", help=".harness/metrics.md 생성 (과거 + 훅 로그)")
    parser.add_argument("--print", dest="to_stdout", action="store_true", help="파일 대신 stdout으로 출력")
    parser.add_argument("--refresh-gh", action="store_true", help="gh 캐시를 무시하고 다시 조회")
    args = parser.parse_args()

    if not (args.baseline or args.metrics or args.to_stdout):
        parser.error("--baseline / --metrics / --print 중 하나는 필요하다")

    runs = load_transcript_runs()
    if args.metrics:
        runs += load_hook_runs()

    runs = [r for r in runs if r["pr"] or r["tool_calls"] > 20]
    pr_meta = fetch_pr_meta([r["pr"] for r in runs if r["pr"]], args.refresh_gh)
    rework = load_rework_index()
    runs = [enrich(r, pr_meta, rework) for r in runs]

    if args.baseline:
        title = "하네스 소급 베이스라인 — 훅 도입 이전 실행 계측"
        note = (
            "훅을 넣기 전 실행들을 **사후에** 계측한 결과다. Claude Code가 세션마다 자동 저장한 "
            "트랜스크립트(`~/.claude/projects/`)에서 추출했으며, 하네스 자체는 이 정보를 아무것도 "
            "기록하지 않았다. 훅 도입 이후 수치와 비교하기 위한 고정 스냅샷이다."
        )
    else:
        title = "하네스 실행 지표"
        note = (
            "`transcript` 행은 훅 도입 이전 소급 추출분, `hook` 행은 로깅 훅이 실시간 기록한 실행이다."
        )

    report = render(runs, title, note)

    if args.to_stdout:
        sys.stdout.write(report)
    else:
        HARNESS_DIR.mkdir(parents=True, exist_ok=True)
        out = HARNESS_DIR / ("baseline.md" if args.baseline else "metrics.md")
        out.write_text(report, encoding="utf-8")
        print(f"작성됨: {out.relative_to(REPO)} ({len(runs)}개 실행)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
