"use client";

import * as React from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { StatCard } from "@/components/library/stat-card";
import { ImportResultBanner } from "@/components/library/import-result-banner";
import { EMPTY_CELL } from "@/components/library/book-table";
import {
  IMPORT_ERROR_COLUMNS,
  IMPORT_WARNING_COLUMNS,
} from "@/components/library/excel-table";
import {
  IconAlertCircle,
  IconBook,
  IconCopy,
  IconUpload,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import type {
  ExcelImportOutcome,
  ExcelImportRowResult,
} from "@/lib/api/excel";

export interface ExcelImportResultProps {
  outcome: ExcelImportOutcome;
  /** 업로드한 파일명 (성공 배너 보조 문구에 표시) */
  fileName: string;
  /** "다른 파일 등록" / "파일 다시 업로드" → idle로 리셋 */
  onReset: () => void;
  className?: string;
}

/**
 * 경고·오류 표의 셀 렌더러 팩토리.
 *
 * 두 표가 같은 행 타입을 쓰고 빈 셀 표기도 같으므로 `renderCell`을 두 벌 손으로 쓰지 않는다.
 * 빈 셀 `—`는 `book-table.ts`의 `EMPTY_CELL`을 재사용한다(재정의 금지).
 */
function makeImportCellRenderer(messageTone: "muted" | "danger") {
  // 이름 있는 함수 표현식이다 — 익명 화살표로 두면 JSX를 반환한다는 이유로
  // eslint(react/display-name)가 컴포넌트로 오인한다. 이건 컴포넌트가 아니라 셀 렌더러다.
  return function renderImportCell(
    col: DataTableColumn<ExcelImportRowResult>,
    value: ExcelImportRowResult[keyof ExcelImportRowResult],
  ): React.ReactNode {
    if (value === null || value === "") {
      return <span className="text-fg-subtle">{EMPTY_CELL}</span>;
    }
    if (col.key === "message" && messageTone === "danger") {
      return <span className="text-danger">{value}</span>;
    }
    return value;
  };
}

const renderWarningCell = makeImportCellRenderer("muted");
const renderErrorCell = makeImportCellRenderer("danger");

/**
 * 엑셀 등록 결과 블록.
 *
 * 성공(201)/거부(409)를 **한 컴포넌트**가 소유한다 — 유니온을 판별하는 지식이 한 곳에만
 * 있어야 하고, 두 갈래가 `ImportResultBanner`와 리셋 계약을 공유하기 때문이다.
 * 배너 아래 본문은 구조가 완전히 달라 분기한다.
 */
export function ExcelImportResult({
  outcome,
  fileName,
  onReset,
  className,
}: ExcelImportResultProps) {
  const [warnOpen, setWarnOpen] = React.useState(false);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const warnListId = React.useId();

  // 결과 블록은 나중에 DOM에 삽입되므로 live region으로 낭독되지 않는다 — 포커스를 옮긴다.
  React.useEffect(() => {
    titleRef.current?.focus();
  }, []);

  if (outcome.status === "rejected") {
    const { data } = outcome;
    return (
      <div className={cn("flex flex-col gap-5", className)}>
        <ImportResultBanner
          tone="danger"
          titleRef={titleRef}
          title={`오류 ${data.errorRows}건으로 등록되지 않았습니다`}
          description="오류가 있으면 파일 전체가 등록되지 않습니다 (all-or-nothing)"
        />

        <p className="rounded-button bg-danger-light px-3.5 py-3 text-base font-semibold text-danger">
          엑셀 파일을 직접 고쳐서 다시 업로드해주세요. 화면에서 행을 직접 수정하는
          기능은 없습니다.
        </p>

        <Card title="오류 목록" noPadding>
          <DataTable
            columns={IMPORT_ERROR_COLUMNS}
            rows={data.errors}
            renderCell={renderErrorCell}
            caption="엑셀 등록 오류 목록"
            emptyText="오류 내역이 없습니다."
          />
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="primary" onClick={onReset}>
            파일 다시 업로드
          </Button>
        </div>
      </div>
    );
  }

  const { data } = outcome;

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <ImportResultBanner
        tone="success"
        titleRef={titleRef}
        title={`${data.createdBooks.toLocaleString()}권 등록완료${
          data.warnRows > 0 ? ` (경고 ${data.warnRows}건)` : ""
        }`}
        description={`${fileName} · 시트 ${data.sheets.length}개 · ${data.committedAt.replace(
          "T",
          " ",
        )} 처리`}
      />

      {/* 디자인의 auto-fit 그리드. Tailwind에 대응 유틸리티가 없어 이 컴포넌트 1곳 한정 임의 속성. */}
      <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        <StatCard
          label="처리 행"
          value={data.totalRows.toLocaleString()}
          sub={`시트 ${data.sheets.length}개`}
          tone="primary"
          subTone="muted"
          icon={<IconUpload />}
        />
        <StatCard
          label="등록 도서"
          value={data.createdBooks.toLocaleString()}
          sub="신규 생성"
          tone="primary"
          subTone="muted"
          icon={<IconBook />}
        />
        <StatCard
          label="등록 소장본"
          value={data.createdBookItems.toLocaleString()}
          sub="전량 대출 가능 상태"
          tone="copy"
          subTone="success"
          icon={<IconCopy />}
        />
        <StatCard
          label="정상 / 경고"
          value={`${data.okRows.toLocaleString()} / ${data.warnRows}`}
          sub="경고 행도 값을 정규화해 등록됨"
          tone="warning"
          subTone="muted"
          icon={<IconAlertCircle />}
        />
      </div>

      {data.warnings.length > 0 ? (
        <Card
          title="경고 목록"
          noPadding
          titleRight={
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={warnOpen}
              aria-controls={warnListId}
              onClick={() => setWarnOpen((v) => !v)}
            >
              {warnOpen ? "접기" : `${data.warnRows}건 펼치기`}
            </Button>
          }
        >
          {/* aria-controls가 가리키는 요소는 접혀 있어도 DOM에 있어야 한다. */}
          <div id={warnListId}>
            {warnOpen ? (
              <DataTable
                columns={IMPORT_WARNING_COLUMNS}
                rows={data.warnings}
                renderCell={renderWarningCell}
                caption="엑셀 등록 경고 목록"
                emptyText="경고가 없습니다."
              />
            ) : null}
          </div>
        </Card>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onReset}>
          다른 파일 등록
        </Button>
        {/*
          `Button`은 <button>이라 링크가 되지 않는다. cva가 export돼 있으므로
          <Link>에 클래스를 입혀 조립한다 — `LinkButton`을 새로 만들지 않는다.
        */}
        <Link
          href="/books/search"
          className={buttonVariants({ variant: "primary" })}
        >
          도서 검색으로 이동
        </Link>
      </div>
    </div>
  );
}
