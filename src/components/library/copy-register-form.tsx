"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast, type ToastTone } from "@/components/ui/toast";
import { BookSelectField } from "@/components/library/book-select-field";
import { StatusBadge } from "@/components/library/status-badge";
import { cn } from "@/lib/utils";
import { isApiError } from "@/lib/api/client";
import type { BookListItem } from "@/lib/api/books";
import {
  createBookItem,
  BOOK_NOT_FOUND_CODE,
  DUPLICATE_MANAGEMENT_NUMBER_CODE,
  INVALID_MANAGEMENT_NUMBER_FORMAT_CODE,
  type BookItem,
} from "@/lib/api/bookitems";

export interface CopyRegisterFormProps {
  /** 등록 성공 시 호출 (목록 refetch 트리거) */
  onCreated?: (bookItem: BookItem) => void;
  /** Card에 전달되는 클래스 */
  className?: string;
}

type ToastState = { open: boolean; tone: ToastTone; message: string };

const CLOSED_TOAST: ToastState = {
  open: false,
  tone: "success",
  message: "",
};

/**
 * 소장본 등록 폼.
 *
 * 제출 조건은 `도서 선택됨 && 관리번호 비어있지 않음`이지만 이를 버튼 `disabled`로
 * 표현하지 않는다 — 왜 못 누르는지 알 수 없고, disabled 버튼은 포커스를 받지 못해
 * 스크린리더 사용자에게 이유가 전달되지 않는다. 대신 제출 시 검증 + 필드 에러 +
 * 포커스 이동으로 처리한다. 관리번호는 네이티브 `required`가 담당하고,
 * "타이핑은 했지만 목록에서 고르지 않은" 사각지대만 handleSubmit이 잡는다.
 */
export function CopyRegisterForm({
  onCreated,
  className,
}: CopyRegisterFormProps) {
  const [selectedBook, setSelectedBook] = React.useState<BookListItem | null>(
    null,
  );
  const [managementNumber, setManagementNumber] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [bookError, setBookError] = React.useState<string | null>(null);
  const [managementNumberError, setManagementNumberError] = React.useState<
    string | null
  >(null);
  const [toast, setToast] = React.useState<ToastState>(CLOSED_TOAST);

  const bookInputRef = React.useRef<HTMLInputElement>(null);

  function handleBookChange(book: BookListItem | null) {
    setSelectedBook(book);
    // 수정 중에 옛 에러가 남지 않게 즉시 되돌린다.
    setBookError(null);
  }

  function handleManagementNumberChange(next: string) {
    setManagementNumber(next);
    setManagementNumberError(null);
  }

  function handleReset() {
    setSelectedBook(null);
    setManagementNumber("");
    setBookError(null);
    setManagementNumberError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookError(null);
    setManagementNumberError(null);

    // 검증은 submitting을 켜기 전에 한다 — 여기서 early return 하면서 submitting을
    // 켜두면 두 버튼이 영구히 disabled로 남는다.
    if (selectedBook === null) {
      setBookError("목록에서 도서를 선택해 주세요.");
      bookInputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const bookItem = await createBookItem(selectedBook.id, {
        managementNumber: managementNumber.trim(),
      });
      setSelectedBook(null);
      setManagementNumber("");
      setToast({
        open: true,
        tone: "success",
        message: "소장본이 등록되었습니다.",
      });
      onCreated?.(bookItem);
    } catch (error) {
      if (
        isApiError(error) &&
        (error.code === INVALID_MANAGEMENT_NUMBER_FORMAT_CODE ||
          error.code === DUPLICATE_MANAGEMENT_NUMBER_CODE)
      ) {
        // 필드 에러로만 내린다 — 토스트는 띄우지 않는다.
        setManagementNumberError(error.detail);
      } else if (isApiError(error) && error.code === BOOK_NOT_FOUND_CODE) {
        // 선택 직후 도서가 사라진 경합. 죽은 bookId를 붙들고 있지 않는다.
        setBookError(error.detail);
        setSelectedBook(null);
      } else {
        setToast({
          open: true,
          tone: "danger",
          message: isApiError(error)
            ? error.detail
            : "소장본 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // Card의 overflow-hidden은 콤보박스 드롭다운을 카드 아래 경계에서 잘라낸다.
    // 호출부 오버라이드(tailwind-merge가 overflow-hidden을 대체)로 해제한다 —
    // 헤더 구분선은 수평선이라 둥근 모서리에 닿지 않고 배경은 border-radius를
    // 따르므로 시각적 회귀가 없다.
    <Card
      title="새 소장본 등록"
      titleAs="h2"
      className={cn("overflow-visible", className)}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <BookSelectField
            value={selectedBook}
            onChange={handleBookChange}
            error={bookError ?? undefined}
            inputRef={bookInputRef}
          />
          <Input
            label="관리번호"
            required
            value={managementNumber}
            onChange={(e) => handleManagementNumberChange(e.target.value)}
            placeholder="예: 문학-0001"
            hint="(주제)-(번호) 형식 · 중복 불가"
            error={managementNumberError ?? undefined}
            autoComplete="off"
          />
        </div>

        <div className="mt-4 flex items-center gap-2 text-base leading-cozy text-fg-muted">
          <span>등록 시 초기 상태</span>
          <StatusBadge status="available" />
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
            {submitting ? "등록 중…" : "등록"}
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
