#!/usr/bin/env python3
"""harness_log.py 회귀 테스트.

모델명 문자열을 리터럴로 쓰지 않고 훅 자신의 MODEL_LABELS에서 가져온다.
(테스트 픽스처에 모델명을 그대로 적으면 환경에 따라 정규화돼 깨진다.)
"""
import importlib.util
import io
import json
import os
import sys
import tempfile
from contextlib import redirect_stdout
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("hl", REPO / ".claude/hooks/harness_log.py")
hl = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hl)

SONNET = hl.MODEL_LABELS["claude-sonnet-5"]
OPUS48 = hl.MODEL_LABELS["claude-opus-4-8"]
PREFIX = "Generated with design-to-frontend harness ("


def trailer(label):
    """자리표시자 없이 조립한다 — 포맷 슬롯이 도중에 치환되면 기대값이 조용히 깨진다."""
    return PREFIX + label + ")"

failures = []


def check(name, ok, detail=""):
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  — {detail}" if detail and not ok else ""))
    if not ok:
        failures.append(name)


def call(mode, payload):
    buf = io.StringIO()
    stdin, sys.stdin = sys.stdin, io.StringIO(json.dumps(payload))
    try:
        with redirect_stdout(buf):
            hl.main.__globals__["sys"].argv = ["hook", mode]
            hl.MODES[mode](json.loads(sys.stdin.read()))
    finally:
        sys.stdin = stdin
    out = buf.getvalue().strip()
    return json.loads(out) if out else None


def main():
    tmp = tempfile.mkdtemp()
    os.environ["CLAUDE_PROJECT_DIR"] = tmp

    # 실측 모델을 Sonnet 5로 만드는 가짜 트랜스크립트
    transcript = Path(tmp) / "t.jsonl"
    transcript.write_text(
        json.dumps({"type": "assistant", "message": {"model": "claude-sonnet-5"}}) + "\n",
        encoding="utf-8",
    )
    base = {"session_id": "t", "hook_event_name": "PreToolUse", "cwd": tmp,
            "transcript_path": str(transcript), "tool_name": "Bash"}

    def commit(body):
        return call("gate-commit", {**base, "tool_input": {"command": f'git commit -m "{body}"'}})

    print("게이트 1 — 커밋 트레일러")
    r = commit("feat(#1): x\n\n" + trailer(OPUS48))
    ok = r and trailer(SONNET) in r["hookSpecificOutput"]["updatedInput"]["command"]
    check("모델명이 틀리면 교정한다", bool(ok), repr(r))

    r = commit("feat(#1): x\n\n" + trailer(SONNET))
    check("모델명이 맞으면 개입하지 않는다", r is None, repr(r))

    r = commit("chore: 오타 수정")
    check("하네스와 무관한 커밋은 건드리지 않는다", r is None, repr(r))

    r = commit("feat(#1): design-to-frontend harness 로 작업")
    ok = r and r["hookSpecificOutput"].get("permissionDecision") == "deny"
    check("트레일러 형식이 아니면 막고 올바른 문자열을 알려준다", bool(ok), repr(r))

    # --- 회귀: 개발 중 이 훅이 git commit이 아닌 Bash 호출까지 받아
    # heredoc 본문의 트레일러를 멋대로 치환한 적이 있다. 다시는 안 되게 막는다.
    def raw(cmd):
        return call("gate-commit", {**base, "tool_input": {"command": cmd}})

    r = raw("python3 - <<'EOF'\nTEXT = \"" + trailer(OPUS48) + "\"\nEOF")
    check("파일을 쓰는 명령의 본문은 건드리지 않는다", r is None, repr(r))

    r = raw("cat > out.txt <<'EOF'\n" + trailer(OPUS48) + "\nEOF")
    check("리다이렉션 본문도 건드리지 않는다", r is None, repr(r))

    r = raw('cd /tmp && git commit -m "feat(#1): x\n\n' + trailer(OPUS48) + '"')
    ok = r and trailer(SONNET) in r["hookSpecificOutput"]["updatedInput"]["command"]
    check("cd 접두사가 붙은 진짜 커밋은 교정한다", bool(ok), repr(r))

    print("\n게이트 2 — 파이프라인 충실도")
    log = Path(tmp) / ".harness/runs/t.jsonl"
    log.parent.mkdir(parents=True, exist_ok=True)
    pr_payload = {**base, "tool_input": {"command": "gh pr create --fill"}}

    r = call("gate-pr", {**base, "tool_input": {"command": "echo gh pr create"}})
    check("gh pr create가 아닌 명령에는 반응하지 않는다", r is None, repr(r))

    log.write_text("", encoding="utf-8")
    r = call("gate-pr", pr_payload)
    msg = (r or {}).get("hookSpecificOutput", {}).get("systemMessage", "")
    check("에이전트 0개면 경고한다", "0/4" in msg, repr(r))
    check("경고일 뿐 막지 않는다", "permissionDecision" not in (r or {}).get("hookSpecificOutput", {}), repr(r))

    with log.open("a", encoding="utf-8") as fh:
        for agent in hl.REQUIRED_AGENTS:
            fh.write(json.dumps({"ev": "SubagentStop", "agent_type": agent}) + "\n")
    r = call("gate-pr", pr_payload)
    check("4개 모두 실행되면 조용하다", r is None, repr(r))

    print("\n로깅 — 예외 안전성")
    hl.mode_log({"session_id": "t", "hook_event_name": "SessionStart", "cwd": tmp,
                 "transcript_path": "/does/not/exist"})
    check("트랜스크립트가 없어도 죽지 않는다", (Path(tmp) / ".harness/runs/t.jsonl").is_file())

    print()
    if failures:
        print(f"실패 {len(failures)}건: {', '.join(failures)}")
        return 1
    print("전부 통과")
    return 0


if __name__ == "__main__":
    sys.exit(main())
