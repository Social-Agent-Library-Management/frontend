"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast, type ToastTone } from "@/components/ui/toast";
import { IconCalendar } from "@/components/icons";
import { isApiError } from "@/lib/api/client";
import {
  createLoan,
  BOOK_ITEM_NOT_AVAILABLE_CODE,
  BOOK_ITEM_NOT_FOUND_CODE,
} from "@/lib/api/loans";

export interface LoanRegisterFormProps {
  /** 등록 성공 시 호출 (목록 refetch 트리거) */
  onCreated?: () => void;
  /** Card에 전달되는 클래스 */
  className?: string;
}

type LoanRegisterFormValues = {
  managementNumber: string;
  borrowerName: string;
  department: string;
};

const EMPTY_VALUES: LoanRegisterFormValues = {
  managementNumber: "",
  borrowerName: "",
  department: "",
};

type ToastState = { open: boolean; tone: ToastTone; message: string };

const CLOSED_TOAST: ToastState = { open: false, tone: "success", message: "" };

/**
 * 백엔드 `Loan.LOAN_PERIOD_DAYS`와 같은 값.
 * 여기 계산은 **제출 전 미리보기 전용**이고 최종 진실은 서버 응답의 `dueDate`다.
 */
const LOAN_PERIOD_DAYS = 14;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * 브라우저 로컬 기준 오늘을 `<input type="date">` 형식으로.
 * `toISOString()`은 UTC라 KST 오전에는 하루 밀린다 — 로컬 필드로 직접 조립한다.
 */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/**
 * "YYYY-MM-DD"에 일수를 더한다(순수 함수).
 * 로컬 `new Date("YYYY-MM-DD")` 파싱은 타임존·DST에 따라 하루가 흔들리므로
 * UTC 밀리초로만 계산한다. 형식이 어긋나면(사용자가 날짜를 비운 경우 포함) null.
 */
function addDays(isoDate: string, days: number): string | null {
  const match = ISO_DATE.exec(isoDate);
  if (!match) return null;

  const shifted = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) +
      days * MS_PER_DAY,
  );
  if (Number.isNaN(shifted.getTime())) return null;

  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(
    shifted.getUTCDate(),
  )}`;
}

// "오늘"은 브라우저의 시계에만 존재한다. 프리렌더된 HTML은 빌드 시점 시계를 쓰므로
// 서버에서 날짜를 그리면 하이드레이션 불일치가 난다(불일치 텍스트는 React가 해당
// 서브트리를 클라이언트에서 통째로 다시 그리게 만든다). useSyncExternalStore로
// 서버 스냅샷은 빈 문자열, 클라이언트 스냅샷은 오늘로 두면 하이드레이션 직후
// 리렌더에서 자연스럽게 채워진다 — 이펙트에서 setState 하지 않는다.
const subscribeToNothing = () => () => {};
const getServerToday = () => "";

/**
 * 대출 등록 폼.
 *
 * 관리번호는 plain `Input`이다 — 백엔드에 관리번호 검색/목록 API가 없어
 * `BookSelectField`(Combobox) 경로를 쓸 수 없다. 존재하지 않거나 대출 불가인
 * 소장본은 서버 에러 코드를 받아 관리번호 필드 에러로 내린다(토스트 아님).
 * 필수 검증은 다른 폼들과 동일하게 네이티브 `required`에 맡긴다.
 */
export function LoanRegisterForm({ onCreated, className }: LoanRegisterFormProps) {
  const [values, setValues] =
    React.useState<LoanRegisterFormValues>(EMPTY_VALUES);
  // null = "사용자가 고르지 않음" → 오늘로 파생된다. 리셋도 이 값을 null로 되돌리면 끝난다.
  const [pickedLoanDate, setPickedLoanDate] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [managementNumberError, setManagementNumberError] = React.useState<
    string | null
  >(null);
  const [toast, setToast] = React.useState<ToastState>(CLOSED_TOAST);

  const managementNumberRef = React.useRef<HTMLInputElement>(null);

  const today = React.useSyncExternalStore(
    subscribeToNothing,
    todayIso,
    getServerToday,
  );
  const loanDate = pickedLoanDate ?? today;
  const dueDatePreview = addDays(loanDate, LOAN_PERIOD_DAYS);

  function updateField(field: keyof LoanRegisterFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // 수정 중에 옛 에러가 남지 않게 즉시 되돌린다.
    if (field === "managementNumber") setManagementNumberError(null);
  }

  function handleReset() {
    // 디자인 원본은 대여일만 오늘로 되돌리지만, 자매 폼(BookRegisterForm/CopyRegisterForm)의
    // "초기화 = 전체 리셋" 컨벤션을 따른다.
    setValues(EMPTY_VALUES);
    setPickedLoanDate(null);
    setManagementNumberError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setManagementNumberError(null);

    try {
      await createLoan({
        managementNumber: values.managementNumber.trim(),
        borrowerName: values.borrowerName.trim(),
        department: values.department.trim(),
        loanDate,
      });
      setValues(EMPTY_VALUES);
      setPickedLoanDate(null);
      setToast({
        open: true,
        tone: "success",
        message:
          "대출이 등록되었습니다. 소장본 상태가 '대출 중'으로 변경되었습니다.",
      });
      onCreated?.();
    } catch (error) {
      if (
        isApiError(error) &&
        (error.code === BOOK_ITEM_NOT_FOUND_CODE ||
          error.code === BOOK_ITEM_NOT_AVAILABLE_CODE)
      ) {
        // 둘 다 "이 관리번호로는 대출할 수 없다"는 뜻이므로 필드 에러로만 내린다.
        setManagementNumberError(error.detail);
        managementNumberRef.current?.focus();
      } else {
        setToast({
          open: true,
          tone: "danger",
          message: isApiError(error)
            ? error.detail
            : "대출 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="새 대출 등록" titleAs="h2" className={className}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Input
            label="관리번호"
            required
            ref={managementNumberRef}
            value={values.managementNumber}
            onChange={(e) => updateField("managementNumber", e.target.value)}
            placeholder="예: 문학-0001"
            hint="대출 가능 상태의 소장본만 등록됩니다"
            error={managementNumberError ?? undefined}
            autoComplete="off"
          />
          <Input
            label="대출자 이름"
            required
            value={values.borrowerName}
            onChange={(e) => updateField("borrowerName", e.target.value)}
            placeholder="대출자 이름을 입력하세요"
            autoComplete="off"
          />
          <Input
            label="부서명"
            required
            value={values.department}
            onChange={(e) => updateField("department", e.target.value)}
            placeholder="부서명을 입력하세요"
            autoComplete="off"
          />
          <Input
            label="대여일"
            required
            type="date"
            value={loanDate}
            onChange={(e) => setPickedLoanDate(e.target.value)}
          />
        </div>

        <div
          className="mt-4 flex items-center gap-2.5 rounded-md bg-primary-light px-3.5 py-3"
          aria-live="polite"
        >
          <span className="flex shrink-0 items-center text-primary" aria-hidden="true">
            <IconCalendar />
          </span>
          <span className="text-base leading-cozy tracking-normal text-fg-muted">
            반납 예정일 (대여일 +{LOAN_PERIOD_DAYS}일 자동 계산)
          </span>
          <strong className="ml-auto text-body leading-cozy font-semibold tracking-normal text-primary">
            {dueDatePreview ?? "—"}
          </strong>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={submitting}
          >
            초기화
          </Button>
          {/* Button의 type 기본값이 "button"이라 제출 버튼에는 반드시 명시한다. */}
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "등록 중…" : "대출 등록"}
          </Button>
        </div>
      </form>

      <Toast
        open={toast.open}
        tone={toast.tone}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </Card>
  );
}
