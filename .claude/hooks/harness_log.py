#!/usr/bin/env python3
"""
design-to-frontend 하네스 로깅 훅.

설계 원칙: 훅은 받아적기만 하고 판단하지 않는다.
집계·분석은 전부 `.claude/scripts/harness_report.py`가 오프라인으로 한다.
덕분에 이 파일의 버그가 하네스 실행을 깨뜨릴 수 없다.

모드:
  log          모든 이벤트를 .harness/runs/<session_id>.jsonl 에 append (기본)
  gate-commit  커밋 트레일러의 모델명을 실측값으로 교정 (유일한 차단 지점)
  gate-pr      PR 생성 직전 파이프라인 충실도 경고 (차단하지 않음)

훅 입출력 규약: https://code.claude.com/docs/en/hooks
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

REQUIRED_AGENTS = (
    "design-interpreter",
    "component-architect",
    "frontend-implementer",
    "qa-inspector",
)

MODEL_LABELS = {
    "claude-opus-4-8": "Claude Opus 4.8",
    "claude-opus-5": "Claude Opus 5",
    "claude-sonnet-5": "Claude Sonnet 5",
    "claude-haiku-4-5-20251001": "Claude Haiku 4.5",
}

TRAILER_RE = re.compile(r"(Generated with design-to-frontend harness \()([^)]*)(\))")
TRAILER_MENTION = "design-to-frontend harness"


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def project_dir(payload: dict) -> Path:
    return Path(os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or ".")


def run_log_path(payload: dict) -> Path:
    session = payload.get("session_id") or "unknown"
    # 경로 조작 방지 — session_id는 파일명으로만 쓴다
    session = re.sub(r"[^A-Za-z0-9_.-]", "_", session)[:80]
    return project_dir(payload) / ".harness" / "runs" / f"{session}.jsonl"


def append(payload: dict, record: dict) -> None:
    path = run_log_path(payload)
    path.parent.mkdir(parents=True, exist_ok=True)
    record = {"t": now(), **record}
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, ensure_ascii=False) + "\n")


def model_label(model_id: str) -> str:
    if not model_id:
        return ""
    return MODEL_LABELS.get(model_id) or re.sub(r"-\d{8}$", "", model_id)


def actual_model(payload: dict) -> str:
    """실제로 이 세션을 돌린 모델 id.

    SessionStart의 `model`은 "not always present"라서 신뢰할 수 없다.
    트랜스크립트의 assistant 엔트리는 `message.model`을 항상 갖고 있으므로
    뒤에서부터 훑어 가장 최근 값을 쓴다.
    """
    path = payload.get("transcript_path")
    if not path:
        return ""
    try:
        with open(path, encoding="utf-8") as fh:
            lines = fh.readlines()
    except OSError:
        return ""
    for line in reversed(lines[-800:]):
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        message = entry.get("message")
        if isinstance(message, dict) and message.get("model"):
            return message["model"]
    return ""


def git_head(payload: dict) -> dict:
    """git 상태를 서브프로세스 없이 읽는다 (훅은 가볍고 빨라야 한다)."""
    root = project_dir(payload) / ".git"
    info = {}
    try:
        head = (root / "HEAD").read_text(encoding="utf-8").strip()
        if head.startswith("ref: "):
            ref = head[5:]
            # 브랜치명 자체에 슬래시가 있다 (feat/#27) — 접두사만 떼야 한다
            info["branch"] = ref[len("refs/heads/"):] if ref.startswith("refs/heads/") else ref
            sha_file = root / ref
            if sha_file.is_file():
                info["sha"] = sha_file.read_text(encoding="utf-8").strip()[:7]
        else:
            info["sha"] = head[:7]
    except OSError:
        pass
    return info


def agents_seen(payload: dict) -> set[str]:
    path = run_log_path(payload)
    seen = set()
    if not path.is_file():
        return seen
    try:
        with path.open(encoding="utf-8") as fh:
            for line in fh:
                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if event.get("ev") in ("SubagentStart", "SubagentStop"):
                    if event.get("agent_type"):
                        seen.add(event["agent_type"])
    except OSError:
        pass
    return seen


def emit(hook_event: str, **fields) -> None:
    print(json.dumps({"hookSpecificOutput": {"hookEventName": hook_event, **fields}}))


# --------------------------------------------------------------------------
# 모드: log — 받아적기만 한다
# --------------------------------------------------------------------------

def mode_log(payload: dict) -> None:
    event = payload.get("hook_event_name") or "?"
    record = {"ev": event}

    if payload.get("agent_type"):
        record["agent_type"] = payload["agent_type"]
    if payload.get("agent_id"):
        record["agent_id"] = payload["agent_id"]

    if event == "SessionStart":
        record.update(git_head(payload))
        record["model"] = actual_model(payload) or payload.get("model") or ""
        record["method"] = payload.get("session_start_method")
        record["permission_mode"] = payload.get("permission_mode")
        record["effort"] = (payload.get("effort") or {}).get("level")
    elif event == "UserPromptSubmit":
        prompt = payload.get("user_prompt") or ""
        record["prompt"] = prompt[:400]
        # 모델 전환 전용 훅 이벤트는 CLI에 없다(2.1.221에서 PostModelSwitch를
        # 등록했다가 "Unknown hook event"로 무시당했다). 대신 요청마다 실모델을
        # 남겨 세션 도중 전환을 요청 단위로 잡는다.
        record["model"] = actual_model(payload) or ""
    elif event in ("PostToolUse", "PostToolUseFailure"):
        tool = payload.get("tool_name") or "?"
        args = payload.get("tool_input") or {}
        record["tool"] = tool
        target = args.get("file_path") or args.get("command") or args.get("pattern") or ""
        record["target"] = str(target)[:160]
        if event == "PostToolUseFailure":
            record["err"] = str(payload.get("tool_error") or "")[:300]
    elif event == "SessionEnd":
        record["reason"] = payload.get("session_end_reason")

    append(payload, record)


# --------------------------------------------------------------------------
# 게이트 1: 커밋 트레일러 모델명 교정
# --------------------------------------------------------------------------

def leading_command(command: str) -> str:
    """실제로 실행되는 첫 명령을 돌려준다.

    settings.json의 `if` 조건만 믿고 명령 문자열을 고치면 안 된다. 실제로
    이 훅은 개발 중에 `git commit`이 아닌 Bash 호출까지 받아 heredoc 안의
    트레일러 문자열을 멋대로 치환한 적이 있다. 파일을 쓰는 명령의 본문에
    트레일러가 들어 있을 수 있으므로, 앞머리 명령이 무엇인지 직접 확인한다.
    """
    for statement in re.split(r"&&|\|\||;|\n", command):
        statement = statement.strip()
        if not statement or re.match(r"(cd|export|set|source)\b", statement):
            continue
        return statement
    return ""


def mode_gate_commit(payload: dict) -> None:
    args = payload.get("tool_input") or {}
    command = args.get("command") or ""

    # 지금 실행되는 명령이 정말 `git commit`일 때만 개입한다.
    if not re.match(r"git\s+commit\b", leading_command(command)):
        return
    # 하네스 커밋이 아니면 손대지 않는다. 일반 커밋을 막으면 안 된다.
    if TRAILER_MENTION not in command:
        return

    real = model_label(actual_model(payload))
    if not real:
        return

    match = TRAILER_RE.search(command)
    if not match:
        # 하네스를 언급하지만 트레일러 형식이 아니다 — 올바른 문자열을 알려주고 막는다.
        emit(
            "PreToolUse",
            permissionDecision="deny",
            permissionDecisionReason=(
                "하네스 커밋에 provenance 트레일러가 없다. 커밋 본문 끝에 정확히 다음 줄을 넣어라:\n"
                f"Generated with design-to-frontend harness ({real})"
            ),
        )
        return

    declared = match.group(2).strip()
    if declared == real:
        return

    fixed = TRAILER_RE.sub(lambda m: m.group(1) + real + m.group(3), command)
    updated = dict(args)
    updated["command"] = fixed
    append(payload, {"ev": "TrailerCorrected", "declared": declared, "actual": real})
    emit(
        "PreToolUse",
        updatedInput=updated,
        systemMessage=f"커밋 트레일러 모델명을 교정했다: {declared} → {real}",
    )


# --------------------------------------------------------------------------
# 게이트 2: 파이프라인 충실도 경고 (차단하지 않는다)
# --------------------------------------------------------------------------

def mode_gate_pr(payload: dict) -> None:
    command = (payload.get("tool_input") or {}).get("command") or ""
    if not re.match(r"gh\s+pr\s+create\b", leading_command(command)):
        return

    seen = agents_seen(payload)
    missing = [a for a in REQUIRED_AGENTS if a not in seen]
    ran = len(REQUIRED_AGENTS) - len(missing)

    append(payload, {"ev": "FidelityChecked", "fidelity": ran, "missing": missing})
    if not missing:
        return

    emit(
        "PreToolUse",
        systemMessage=(
            f"[하네스] 파이프라인 충실도 {ran}/4 — 이 PR은 전문 에이전트를 일부만 거쳤다.\n"
            f"  생략됨: {', '.join(missing)}\n"
            "PR은 그대로 생성된다. 리뷰·머지 시 이 점을 감안할 것."
        ),
    )


MODES = {"log": mode_log, "gate-commit": mode_gate_commit, "gate-pr": mode_gate_pr}


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else "log"
    try:
        payload = json.loads(sys.stdin.read() or "{}")
    except (json.JSONDecodeError, OSError):
        return 0  # 입력이 깨져도 하네스를 멈추지 않는다

    try:
        MODES.get(mode, mode_log)(payload)
    except Exception as exc:  # noqa: BLE001 — 훅은 어떤 이유로도 워크플로를 막지 않는다
        try:
            append(payload, {"ev": "HookError", "mode": mode, "err": str(exc)[:300]})
        except Exception:  # noqa: BLE001
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
